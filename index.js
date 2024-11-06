const express = require("express");
const CryptoJS = require("crypto-js");
var levelup = require("levelup");
var leveldown = require("leveldown");
const os = require("os");
const { exec, execSync } = require("child_process");
const { print } = require("pdf-to-printer");
const { unlinkSync, existsSync } = require("fs");
const rateLimit = require("express-rate-limit"); // Import the rateLimit function
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken"); // Import JWT
const bodyParser = require("body-parser");
const cors = require("cors");
var path = require("path");
const cluster = require("cluster");
const app = express();
const multer = require("multer");
const xlsx = require("xlsx");
const puppeteer = require("puppeteer");
const fs = require('fs');
const creditMiddleware = require("./env/credit");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Specify your upload directory
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Save with original file name
  },
});

// Initialize upload with file size limit
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limit set to 2MB
}).single("file");

// Define your database path
const dbPath = path.join(__dirname, "data");

// Define the path to the LOCK file
const lockFilePath = path.join(dbPath, "LOCK");

const clearLockFile = () => {
  if (existsSync(lockFilePath)) {
    unlinkSync(lockFilePath); // Remove the LOCK file
  }
};

// Clear the LOCK file before opening the database
clearLockFile();

// Open the LevelDB database
// const db = level(dbPath, { valueEncoding: "json" });

var db = levelup(leveldown(dbPath));

// var dbPath = process.env.DB_PATH || path.join(__dirname, "./mydb");
// var db = new level.Level(dbPath); // Initialize the LevelDB instance

// Middleware to parse JSON request bodies
app.use(bodyParser.json({ limit: "100mb" })); // Increase the limit
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true })); // For form data
app.use(cors());

creditMiddleware(app, db);

// Increase payload limit for application/json
app.use(bodyParser.json({ limit: "50mb" })); // Set a suitable limit, e.g., 10MB

// Increase payload limit for application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.log(`Multer error: `, err);

    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .send({ error: "File size exceeds the limit of 2MB." });
    }
  }
  next(err); // Pass on any other errors
});

// Determine if running inside pkg
const isPkg = typeof process.pkg !== 'undefined';
// Base path is different when running inside pkg
const basePath = isPkg ? path.dirname(process.execPath) : __dirname;

// Construct the path to the static files
const staticFilesPath = path.join(basePath, 'frontend', 'dist', 'frontend', 'browser');

// Serve static files from the Angular dist directory
app.use(express.static(staticFilesPath));

// Handle root route
app.get('/', (req, res) => {
  res.sendFile(path.join(staticFilesPath, 'index.html'));
});

const numberToBase36 = (number) => {
  const chars = "QHZ0WSX1C2DER4FV3BGTN7AYUJ8M96K5IOLP";
  let base36 = "";
  while (number > 0) {
    let remainder = number % 36;
    base36 = chars[remainder] + base36;
    number = Math.floor(number / 36);
  }
  return base36 || "0"; // Ensure at least one character is returned
};

const generateId = async (entity) => {
  // Generate a unique ID (simple example)
  let count = await db.get("count:" + entity).catch(() => 0);
  count = Number(count) + 1;
  await db.put("count:" + entity, count);
  return `${numberToBase36(count)}`;
};

const getHashData = async (hashedText) => {
  try {
    // Attempt to get the data from the database
    const buffer = await db.get("HashData:" + hashedText);

    if (buffer) {
      // Convert buffer to a string using UTF-8 encoding
      const data = buffer.toString("utf-8");

      // Parse the string to JSON object
      const jsonData = JSON.parse(data);

      return jsonData;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};

const makeHash = async (keywords, elementKey, schema, id) => {
  if (elementKey == "lastUpdated" || elementKey == "created") {
    return;
  }
  try {
    if (!keywords) {
      return;
    }
    keywords = keywords.toString().toLowerCase().split(" ");
    for (const keyword of keywords) {
      if (!(keyword == "" || keyword == " ")) {
        const hashedText = CryptoJS.SHA256(
          keyword.replace(/[,.]/g, "")
        ).toString();
        let data = await getHashData(hashedText);

        if (data) {
          if (!data[keyword]) data[keyword] = {};

          if (!data[keyword][schema]) data[keyword][schema] = {};

          if (!data[keyword][schema][elementKey])
            data[keyword][schema][elementKey] = [];

          data[keyword][schema][elementKey].push(id);

          await db.put("HashData:" + hashedText, JSON.stringify(data));
        } else {
          const newData = {
            [keyword]: {
              [schema]: {
                [elementKey]: [id],
              },
            },
          };

          await db.put("HashData:" + hashedText, JSON.stringify(newData));
        }
      }
    }
  } catch (error) {
    console.log("Error in makeHash:", error);
  }
};

const addAttributes = async (attributes, parentSchema, parentId) => {
  let addedAttributes = [];
  for (let index = 0; index < attributes.length; index++) {
    const attribute = attributes[index];
    const attributeName = Object.keys(attribute)[0];
    const attributeValue = Object.values(attribute)[0];
    const attributeData = {
      parentSchema,
      parentId,
      name: attributeName,
      indexInForm: index,
      ...getTypes(attributeValue),
    };
    try {
      const id = await generateId("Attribute");
      attributeData.id = id;
      await db.put("Attribute:" + id, attributeData);
      addedAttributes.push(attributeData);
    } catch (error) {
      console.error("Error adding attribute:", error);
    }
  }
  return addedAttributes;
};

const getTypes = (val) => {
  const typeObj = {
    valueType: typeof val,
  };
  switch (typeObj.valueType) {
    case "string":
      typeObj.typeString = val;
      break;
    case "number":
      if (Number.isInteger(val)) {
        typeObj.typeInt = val;
      } else {
        typeObj.valueType = "double";
        typeObj.typeDouble = val;
      }
      break;
    case "boolean":
      typeObj.typeBool = val;
      break;
    case "object":
      typeObj.typeObject = JSON.stringify(val);
      break;
    default:
      return null;
  }
  return typeObj;
};

const getAttributesList = async (schema, data) => {
  const schemaList = await db.get("Schema:" + schema).catch(() => ({}));
  const schemaKeys = Object.keys(schemaList);
  const dataKeys = Object.keys(data);
  const commonKeys = dataKeys.filter((key) => schemaKeys.includes(key));
  const attributes = [];
  const dataObj = {};

  for (const key of dataKeys) {
    if (commonKeys.includes(key)) {
      dataObj[key] = data[key];
    } else {
      attributes.push({ [key]: data[key] });
    }
  }

  if (attributes.length > 0) {
    await addAttributes(attributes, schema, data.id);
  }
  return dataObj;
};

const addData = async (schema, data, useHash = false) => {
  if (!data?.id) {
    data.id = await generateId(schema);
  }

  // Uncomment and customize as needed
  // if (!isNaN(data?.barcode)) {
  //   data.barcode = "**" + data?.barcode + "**";
  // }
  // if (!isNaN(data?.contactNumber)) {
  //   data.contactNumber = "**" + data?.contactNumber + "**";
  // }

  data.id = data.id.toString();
  data.created = new Date().toISOString();
  data.lastUpdated = new Date().toISOString();

  try {
    await db.put(schema + ":" + data.id, JSON.stringify(data));
    const dataObject = await db.get(schema + ":" + data.id);
    if (useHash) {
      for (let index = 0; index < Object.keys(data).length; index++) {
        const element = Object.keys(data)[index];
        await makeHash(data[element], element, schema, data.id);
      }
    }
    return JSON.parse(dataObject.toString("utf-8"));
  } catch (error) {
    throw error;
  }
};

app.post("/add/:entity", async (req, res) => {
  try {
    const { entity } = req.params;

    const data = req.body;
    const useHash = true; //req.data.useHash === "true";
    const result = await addData(entity, data, useHash);
    res.json(result);
  } catch (error) {
    res.status(500).send("Error: " + error.message);
  }
});

// Function to parse Excel file
const parseExcelFile = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0]; // Assuming the first sheet
  const sheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(sheet); // Convert sheet to JSON format
};

const addBulkData = async (schema, dataArray, useHash = false) => {
  const results = [];

  for (const data of dataArray) {
    if (!data?.id) {
      data.id = await generateId(schema);
    }

    data.id = data.id.toString();
    data.created = new Date().toISOString();
    data.lastUpdated = new Date().toISOString();

    try {
      await db.put(schema + ":" + data.id, JSON.stringify(data));
      const dataObject = await db.get(schema + ":" + data.id);

      if (useHash) {
        for (const key of Object.keys(data)) {
          await makeHash(data[key], key, schema, data.id);
        }
      }

      results.push(JSON.parse(dataObject.toString("utf-8")));
    } catch (error) {
      console.log("Error adding data:", error);
      throw error;
    }
  }

  return results;
};

// Route to handle Excel file upload and bulk insert
app.post("/add/bulk/:entity", upload, async (req, res) => {
  try {
    const { entity } = req.params;
    console.log(`Received request to add bulk data for entity: ${entity}`);

    // Check if a file was uploaded
    if (!req.file) {
      console.log("No file uploaded");
      return res.status(400).send({ error: "No file uploaded" });
    }

    console.log(`Uploaded file: ${req.file.originalname}`);

    // Parse the uploaded Excel file
    const dataArray = parseExcelFile(req.file.path);
    console.log(
      `Parsed ${dataArray.length} rows from the uploaded Excel file.`
    );

    const useHash = true; // Can be configurable based on request

    // Add data to the database
    const results = await addBulkData(entity, dataArray, useHash);
    console.log(
      `Successfully added ${results.length} records to the database.`
    );

    // Send results back
    res.json(results);
  } catch (error) {
    console.error("Error processing bulk upload:", error.message);
    res.status(500).send("Error: " + error.message);
  }
});

const removeDuplicates = (items) => {
  if (!items?.length) return [];
  const uniqueItems = [];
  const itemsSet = new Set();
  items.forEach((i) => {
    if (!itemsSet.has(i.id)) {
      itemsSet.add(i.id);
      uniqueItems.push(i);
    }
  });
  return uniqueItems;
};

const HashSearch = async (keyword, schema, filterBy, limit) => {
  if (!isNaN(keyword)) {
    keyword = keyword.toString();
  }

  keyword = keyword.toString().toLowerCase();

  if (keyword.length < 1) return [];

  const textArray = keyword.split(" ");

  if (textArray.length > 1) {
    let data = await HashSearchUN(
      textArray[0].replace(/[,. ]/g, ""),
      schema,
      filterBy
    );

    const filteredResults = data.filter((p) =>
      textArray
        .slice(1)
        .every((element) =>
          JSON.stringify(p).toLowerCase().includes(element.toLowerCase())
        )
    );
    if (limit > 0) {
      return removeDuplicates(filteredResults)?.slice(0, limit);
    } else {
      return removeDuplicates(filteredResults);
    }
  } else {
    let results = await HashSearchUN(
      keyword.replace(/[,.]/g, ""),
      schema,
      filterBy
    );

    if (limit > 0) {
      return removeDuplicates(results)?.slice(0, limit);
    } else {
      return removeDuplicates(results);
    }
  }
};

const HashSearchUN = async (keyword, schema, filterBy) => {
  keyword = keyword.toString().toLowerCase();

  const hashText = CryptoJS.SHA256(keyword).toString();
  const hashData = await getHashData(hashText);
  if (!hashData || !hashData[keyword]) return [];

  const getOutDataWithSchema = async (schemaValue, schemaName) => {
    if (!schemaValue) return [];

    const getDataByIds = async (field) => {
      const o3 = [];
      if (schema) {
        try {
          const d = await db.get(schema + ":" + keyword.toUpperCase());
          if (d) {
            o3.push(JSON.parse(d));
          }
        } catch (error) {
          // Handle error
        }
      }
      for (const item_id of field) {
        try {
          const item = await db.get(schemaName + ":" + item_id);
          if (item) {
            o3.push(JSON.parse(item));
          }
        } catch (error) {
          // Handle error
        }
      }
      return o3;
    };

    if (filterBy) {
      if (!schemaValue[filterBy]) return [];
      return await getDataByIds(schemaValue[filterBy]);
    }

    let o5 = [];
    for (const field of Object.values(schemaValue)) {
      const items = await getDataByIds(field);
      o5.push(...items);
    }
    return o5;
  };

  if (!schema) {
    let o = [];
    for (const [schemaName, schemaValue] of Object.entries(hashData[keyword])) {
      const schemaResults = await getOutDataWithSchema(schemaValue, schemaName);
      o.push(...schemaResults);
    }
    return o;
  }
  return await getOutDataWithSchema(hashData[keyword][schema], schema);
};

app.get("/search", async (req, res) => {
  const { keyword, schema, filterBy, limit } = req.query;

  try {
    const results = await HashSearch(
      keyword,
      schema,
      filterBy,
      parseInt(limit, 10)
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/read/:entity/:start/:end", async (req, res) => {
  let { entity, start, end } = req.params;

  // Parse and log start and end parameters
  start = parseInt(start, 10) || 0;
  end = parseInt(end, 10) || 50;
  let results = [];
  let currentIndex = 0;
  const stream = db.createReadStream();

  try {
    stream
      .on("data", (data) => {
        // Log each key and value being processed
        //     console.log(`Processing key: ${data.key}, value: ${data.value}`);

        const [storedEntity, id] = data.key.toString().split(":");

        // Log parsed entity and ID for debugging
        //console.log(`Parsed entity: ${storedEntity}, ID: ${id}`);

        // Convert value buffer to string and try to parse it as JSON
        let item;
        const valueStr = data.value.toString();
        try {
          item = JSON.parse(valueStr);
          // console.log(`Parsed JSON item: ${JSON.stringify(item)}`);
        } catch (e) {
          item = valueStr;
        }
        if (start > currentIndex) {
          currentIndex++;
        }
        if (
          storedEntity === entity &&
          currentIndex >= start &&
          currentIndex < end
        ) {
          results.push(item);
          currentIndex++;
        }
      })
      .on("end", () => {
        if (results.length > 0) {
          res.status(200).send(results);
        } else {
          res.status(404).send({
            message: "No records found for the specified entity and range.",
          });
        }
      })
      .on("error", (error) => {
        console.error("Stream error:", error);
        res
          .status(500)
          .send({ error: "Error fetching data", details: error.message });
      });
  } catch (error) {
    console.error("Processing error:", error);
    res
      .status(500)
      .send({ error: "Error processing request", details: error.message });
  }
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
// Sign-up endpoint

app.post("/signup", limiter, async (req, res) => {
  const { firstName, lastName, phoneNumber, password } = req.body;

  // Validate the input
  if (!firstName || !lastName || !phoneNumber || !password) {
    return res.status(400).send({ error: "All fields are required" });
  }

  try {
    // Check if a user with the same phone number already exists
    const userExists = await db
      .get(`user:phone:${phoneNumber}`)
      .catch(() => null);
    if (userExists) {
      return res
        .status(400)
        .send({ message: "User with this phone number already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds
    const id = await generateId("user"); // Generate ID for the new user

    let count = await db.get("count:" + "user").catch(() => 0);

    count = Number(count);
    let roleId = null; // Variable to hold the role ID
    var roleData = {};
    console.log("roleId cou ", count);
    let rid = await generateId("roles");
    if (count === 1) {
      // Create default role if users array is empty
      roleData = {
        id: rid,
        name: "superuser",
        permissions: [
          "home",
          "inventory_management",
          "sales",
          "access_control",
          "reportings_sales",
          "settings",
        ],
        created: new Date(),
      };

      // Generate ID for the role and store it

      roleId = "roles:" + rid;
      await db.put(roleId, JSON.stringify(roleData));
    }

    // Create a user object
    var user = {
      id, // Store the user ID as part of the user object
      firstName,
      lastName,
      phoneNumber,
      password: hashedPassword, // Store hashed password

      createdAt: new Date(),
    };

    if (roleId) {
      user.roles = [roleData];
    }

    // Store user in the database
    const phoneKey = `user:phone:${phoneNumber}`; // Store by phone number for easy lookup
    const userKey = `user:${id}`; // Composite key for user storage
    await db.put(phoneKey, userKey); // Save phone to user key reference
    await db.put(userKey, JSON.stringify(user)); // Save the user data

    // Generate JWT token
    const token = jwt.sign(user, "YOUR_SECRET_KEY"); // Replace with actual secret

    // Send success response with token
    res.status(201).send({
      message: "User registered successfully",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        roles: user.roles, // Include role information in the response
      },
      token,
    });
  } catch (error) {
    console.error("Error creating user:", error); // Log error for debugging
    res
      .status(500)
      .send({ error: "Error creating user", details: error.message });
  }
});

// Sign-in endpoint
app.post("/signin", limiter, async (req, res) => {
  const { phoneNumber, password } = req.body;

  // Validate the input
  if (!phoneNumber || !password) {
    return res
      .status(400)
      .send({ message: "Phone number and password are required" });
  }

  try {
    // Fetch the user key from the phone number reference
    const userKey = await db.get(`user:phone:${phoneNumber}`).catch(() => null);

    if (!userKey) {
      return res.status(404).send({ error: "User not found" });
    }

    // Fetch the user data from the user key
    const userData = await db.get(userKey).catch((err) => {
      console.error("Error retrieving user data:", err);
      return null;
    });

    // If userData is undefined or null, return an error
    if (!userData) {
      return res
        .status(500)
        .send({ error: "Error retrieving user information" });
    }

    // Parse the user data
    let user;
    try {
      user = JSON.parse(userData); // Ensure the data is a valid JSON string
    } catch (jsonErr) {
      console.error("Error parsing user data:", jsonErr);
      return res.status(500).send({ error: "Invalid user data format" });
    }

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).send({ message: "Invalid credentials" });
    }

    // Generate JWT token (optional) - Replace 'SECRET_KEY' with your actual key
    const token = jwt.sign(
      {
        id: user.id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      "YOUR_SECRET_KEY"
    );

    // Sign-in success, send token and user info (omit sensitive data)
    res.status(200).send({
      message: "Sign-in successful",
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error in sign-in process:", error);
    res
      .status(500)
      .send({ message: "Error signing in", details: error.message });
  }
});

// Get item by ID for a dynamic entity (READ by ID)
app.get("/read/:entity/:id", async (req, res) => {
  const { entity, id } = req.params;

  try {
    // Create the composite key
    const key = `${entity}:${id}`;

    // Fetch the item from the database
    const item = await db.get(key).catch(() => null);

    if (!item) {
      return res.status(404).send({ error: "Item not found" });
    }

    res.send(JSON.parse(item)); // Send the item as a JSON response
  } catch (error) {
    res.status(500).send({ error: "Error fetching item", details: error });
  }
});

// Search for items by key and value for a dynamic entity (READ by key-value)
app.get("/read_key_value/:entity/search/:key/:value", async (req, res) => {
  const { entity, key, value } = req.params;
  let results = [];

  try {
    db.createReadStream()
      .on("data", (data) => {
        // Parse the composite key to ensure the correct entity
        const [storedEntity, id] = data.key.split(":");
        const item = JSON.parse(data.value);

        // Match entity and check if the item key matches the value
        if (storedEntity === entity && item[key] === value) {
          results.push(item);
        }
      })
      .on("end", () => res.send(results))
      .on("error", (error) =>
        res.status(500).send({ error: "Error fetching data", details: error })
      );
  } catch (error) {
    res.status(500).send({ error: "Error processing request", details: error });
  }
});

app.put("/update/:entity/:id", async (req, res) => {
  const { entity, id } = req.params;
  const updatedItem = req.body;

  try {
    // Create the composite key
    const key = `${entity}:${id}`;

    // Check if the item exists
    const result = await db.get(key);

    // Convert the result to a string and parse it as JSON
    const existingItem = result ? JSON.parse(result.toString("utf-8")) : null;

    if (!existingItem) {
      return res.status(404).send({ error: "Item not found" });
    }

    // Update the item
    await db.put(key, JSON.stringify(updatedItem));

    let updatedHashes = [];

    // Iterate over updatedItem keys
    for (const [key, value] of Object.entries(updatedItem)) {
      const oldValue = existingItem[key];

      if (oldValue) {
        if (oldValue != value) {
          updatedHashes.push(key);
          let valuies = oldValue.toString().toLowerCase().split(" ");
          for (let indexe = 0; indexe < valuies.length; indexe++) {
            const element3 = valuies[indexe];
            const hashedText = CryptoJS.SHA256(
              element3.replace(/[,.]/g, "")
            ).toString();
            let hs = await getHashData(hashedText);
            if (hs) {
              // Ensure hs[oldValue][entity][key] is an array
              hs[oldValue] ??= {}; // Initialize hs[oldValue] if null or undefined
              hs[oldValue][entity] ??= {}; // Initialize hs[oldValue][entity] if null or undefined
              hs[oldValue][entity][key] ??= []; // Initialize hs[oldValue][entity][key] as an array if it's not already one

              // Remove the item from old value array
              const index = hs[oldValue][entity][key].indexOf(id);
              if (index > -1) {
                hs[oldValue][entity][key].splice(index, 1);
              }

              await db.put("HashData:" + hashedText, JSON.stringify(hs));
            }
          }
        }
      }
    }

    // Update hash data for new values
    for (const key of updatedHashes) {
      await makeHash(updatedItem[key], key, entity, id);
    }

    res.send({
      message: `Item updated successfully in ${entity}`,
      updatedItem,
    });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).send({ error: "Error updating item", details: error });
  }
});

// Delete an item for a dynamic entity (DELETE)
app.delete("/delete/:entity/:id", async (req, res) => {
  const { entity, id } = req.params;

  try {
    // Create the composite key
    const key = `${entity}:${id}`;

    // Check if the item exists
    const result = await db.get(key);

    // Convert the result to a string and parse it as JSON
    const existingItem = result ? JSON.parse(result.toString("utf-8")) : null;

    if (!existingItem) {
      return res.status(404).send({ error: "Item not found" });
    }

    // Iterate over updatedItem keys
    for (const [key, value] of Object.entries(existingItem)) {
      const oldValue = existingItem[key];

      let valuies = oldValue.toString().toLowerCase().split(" ");
      for (let indexe = 0; indexe < valuies.length; indexe++) {
        const element3 = valuies[indexe];
        const hashedText = CryptoJS.SHA256(
          element3.replace(/[,.]/g, "")
        ).toString();
        let hs = await getHashData(hashedText);

        if (hs) {
          let hs = await getHashData(hashedText);
          // Ensure hs[oldValue][entity][key] is an array
          hs[oldValue] ??= {}; // Initialize hs[oldValue] if null or undefined
          hs[oldValue][entity] ??= {}; // Initialize hs[oldValue][entity] if null or undefined
          hs[oldValue][entity][key] ??= []; // Initialize hs[oldValue][entity][key] as an array if it's not already one

          // Remove the item from old value array
          const index = hs[oldValue][entity][key].indexOf(id);
          if (index > -1) {
            hs[oldValue][entity][key].splice(index, 1);
          }

          await db.put("HashData:" + hashedText, JSON.stringify(hs));
        }
      }
    }
    // Delete the item
    await db.del(key);

    res.send({ message: `Item deleted successfully from ${entity}` });
  } catch (error) {
    res.status(500).send({ error: "Error deleting item", details: error });
  }
});

app.get("/sort_by", async (req, res) => {
  try {
    const entity = req.query.entity || "Inventory"; // Default to 'Inventory' if not provided
    const sortBy = req.query.sort_by || "sold"; // Default to 'sold' if not provided
    const limit = parseInt(req.query.limit) || 20; // Default limit to 20 items if not provided

    let items2 = [];

    db.createReadStream()
      .on("data", (data) => {
        try {
          const [currentEntity, id] = data.key.toString().split(":");

          // Ensure the value is valid and non-empty
          const dataValue = data.value && data.value.toString();
          if (dataValue) {
            // Attempt to parse the JSON
            const item = JSON.parse(dataValue);

            // Push item to the list if it matches the entity and has the sortBy field
            if (currentEntity === entity && item?.[sortBy] !== undefined) {
              if (entity == "inventory_items") {
                if (item.stock - item.sold > 0) {
                  items2.push(item);
                }
              } else {
                items2.push(item);
              }
            }
          }
        } catch (parseError) {
          console.error(
            `Error parsing JSON for key ${data.key}:`,
            parseError.message
          );
        }
      })
      .on("end", () => {
        // Sort items based on the 'sort_by' field in descending order
        items2.sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));

        // Limit the number of returned items
        const topItems = items2.slice(0, limit);

        // Send the sorted and limited results back to the client
        res.status(200).json(topItems);
      })
      .on("error", (error) => {
        console.error("Error during read stream:", error);
        res
          .status(500)
          .send({ error: "Error fetching items", details: error.message });
      });
  } catch (error) {
    console.error("Error in /sort_by handler:", error);
    res
      .status(500)
      .send({ error: "Error processing request", details: error.message });
  }
});

function getPrinters() {
  return new Promise((resolve, reject) => {
    // Execute the command to list printers
    exec("wmic printer get name", (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      // Parse the output
      const printers = stdout.split("\n").filter((name) => name.trim() !== "");
      resolve(printers);
    });
  });
}

const getCleanPrinterNames = (printers) => {
  return printers
    .map((printer) => printer.trim().replace(/\r/g, "").replace(/\s+/g, " "))
    .slice(1); // Remove the first element
};

// Endpoint to get the list of available printers
app.get("/printers", async (req, res) => {
  try {
    const printers = await getPrinters(); // Get the list of printers
    const printerNames = getCleanPrinterNames(printers);
    res.json(printerNames); // Send printer information as JSON response
  } catch (error) {
    console.error("Error retrieving printers:", error);
    res.status(500).send("Error retrieving printers");
  }
});

let port = 7777;
// Endpoint to get network interfaces
app.get("/network-interfaces", (req, res) => {
  const networkInterfaces = os.networkInterfaces();
  const addresses = [];

  Object.keys(networkInterfaces).forEach((iface) => {
    networkInterfaces[iface].forEach((ifaceDetails) => {
      if (ifaceDetails.family === "IPv4" && !ifaceDetails.internal) {
        addresses.push({
          interface: iface,
          address: ifaceDetails.address + ":" + port,
        });
      }
    });
  });

  res.json(addresses);
});

function getChromePath() {
  let chromePath = null;

  // First, try to find Chrome in the Windows Registry under HKEY_LOCAL_MACHINE
  chromePath = queryRegistry(
    'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe'
  );

  if (chromePath && fs.existsSync(chromePath)) {
    return chromePath;
  }

  // Next, try to find Chrome in the Windows Registry under HKEY_CURRENT_USER
  chromePath = queryRegistry(
    'HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe'
  );

  if (chromePath && fs.existsSync(chromePath)) {
    return chromePath;
  }

  // If not found in the registry, check common installation paths
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env.PROGRAMFILES, 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env['PROGRAMFILES(X86)'], 'Google\\Chrome\\Application\\chrome.exe'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  console.error('Google Chrome executable not found.');
  return null;
}

function queryRegistry(registryKey) {
  try {
    const result = execSync(`reg query "${registryKey}" /ve`, { encoding: 'utf-8' });
    const match = result.match(/(?:\s+)?\(Default\)\s+REG_SZ\s+(.*)/i);
    if (match && match[1]) {
      const chromePath = match[1].trim();
      // Replace environment variables if any (e.g., %ProgramFiles%)
      const resolvedPath = chromePath.replace(/%([^%]+)%/g, (_, key) => process.env[key]);
      return resolvedPath;
    } else {
      return null;
    }
  } catch (error) {
    // Suppress errors to try other methods
    return null;
  }
}

app.post('/print-html', async (req, res) => {
  const { printerName, htmlContent, refCode } = req.body;

  if (!htmlContent) {
    return res.status(400).send('HTML content is required');
  }

  try {
    // Get the default browser path
    const browserPath = getChromePath();

    if (!browserPath) {
      console.error('Default browser path not found.');
      return res.status(500).send('Default browser not found on server.');
    }

    // Launch Puppeteer browser using the default browser path
    const browser = await puppeteer.launch({
      executablePath: browserPath, // Use the fetched browser path
      headless: true, // Run in headless mode
    });
    const page = await browser.newPage();

    // Set HTML content
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0', // Ensure all resources are loaded
    });

    // Calculate the height of the content
    const height = await page.evaluate((refCode) => {
      const element = document.querySelector(`.receipt-${refCode}-container`); // Select the specific element by class
      return element ? element.scrollHeight + 20 : 0; // Return the height or 0 if the element is not found
    }, refCode); // Pass refCode as an argument

    // Define PDF options
    const pdfOptions = {
      width: '80mm', // Width set to 80mm
      height: `${height}px`, // Set the height dynamically based on content
      printBackground: true, // Ensure background styles are printed
    };

    // Generate PDF and save to a file
    const pdfFilePath = path.join(__dirname, 'uploads', `generated_${refCode}.pdf`);
    await page.pdf({
      path: pdfFilePath,
      ...pdfOptions,
    });

    // Close the browser instance
    await browser.close();

    // Printer options
    const options = {
      printer: printerName,
      orientation: 'portrait',
      monochrome: false,
      side: 'duplexlong',
      paperSize: '80mm',
      silent: true,
      copies: 1,
    };

    // Print the PDF
    await print(pdfFilePath, options);

    // Clean up the temporary PDF file if desired
    // fs.unlinkSync(pdfFilePath);

    // Send the file back to the client or indicate success
    res.sendFile(pdfFilePath);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    res.status(500).send(`Failed to generate PDF: ${error.message}`);
  }
});

const pdfUpload = multer({ storage: storage }).single("pdfFile");

// Print API endpoint
app.post("/print", pdfUpload, async (req, res) => {
  var { printerName, pdfFileName } = req.body;

  if (!pdfFileName) {
    return res.status(400).send("PDF file is required");
  }

  pdfFileName = path.join(__dirname, "uploads", pdfFileName);

  try {
    // Print the PDF to the specified printer
    var options = pdfFileName
      ? {
          printer: printerName,
          orientation: "portrait",
          scale: "fit",
          monochrome: false,
          side: "duplexlong",
          paperSize: "80mm",
          silent: true,
          copies: 1,
        }
      : {};

    await print(pdfFileName, options);

    // Clean up the temporary PDF file
    unlinkSync(pdfFileName);
    res.send("Printing successful");
  } catch (error) {
    console.error("Printing failed:", error);
    res.status(500).send("Printing failed");
  }
});

/**
 * @route GET /dashboard_info/:from?/:to?
 * @desc Get sales and product stock data for the dashboard within a specified date range.
 * @param {string} from - Start date (optional, defaults to yesterday).
 * @param {string} to - End date (optional, defaults to tomorrow).
 */
app.get("/dashboard_info/:from?/:to?", async (req, res) => {
  const { from, to } = req.params;

  // Helper function to get date formatted as YYYY-MM-DD
  const formatDate = (date) => date.toISOString().split("T")[0];

  // Set default 'from' as yesterday and 'to' as tomorrow
  const today = new Date();
  const defaultFrom = new Date(today);
  defaultFrom.setDate(today.getDate() - 1); // Yesterday
  const defaultTo = new Date(today);
  defaultTo.setDate(today.getDate() + 1); // Tomorrow

  // Use provided dates or default to yesterday and tomorrow
  const startDate = from ? new Date(from) : defaultFrom;
  const endDate = to ? new Date(to) : defaultTo;
console.log('start date: ', startDate, 'endDate: ' , endDate)
  // Initialize dashboard data structure
  const response = {
    stamp: {
      from: startDate,
      to: endDate,
      timeStamp: Date.now(),
    },
    sales: {
      quantity: 0,
      totalValue: 0,
      average: 0,
    },
    products: {
      inStock: {
        variations_count: 0,
        stock_count: 0,
        value: 0,
      },
      lowStock: {
        quantity: 0,
        value: 0,
      },
      outOfStock: {
        quantity: 0,
        value: 0,
      },
    },
  };

  try {
    // Start reading the database
    db.createReadStream()
      .on("data", (data) => {
        try {
          const [entityType, id] = data.key.toString().split(":");

          const dataValue = data.value && data.value.toString();
          if (dataValue) {
            const item = JSON.parse(dataValue);

            // Handle sales data
            if (entityType === "sales") {
              const saleDate = new Date(item.created);
              if (saleDate >= startDate && saleDate <= endDate) {
                response.sales.quantity += 1;
                response.sales.totalValue += item.total;
              }
            }

            // Handle inventory items
            if (entityType === "inventory_items") {
              const availableStock = item.stock - item.sold;
              if (availableStock > 0) {
                response.products.inStock.stock_count += availableStock;
                response.products.inStock.variations_count += 1;
                response.products.inStock.value +=
                  item.salePrice * availableStock;
              }
              if (availableStock <= item.min_stock) {
                response.products.lowStock.quantity += 1;
                response.products.lowStock.value +=
                  item.salePrice * availableStock;
              }
              if (availableStock <= 0) {
                response.products.outOfStock.quantity += 1;
                response.products.outOfStock.value +=
                  item.buyPrice * (item.min_stock || 1);
              }
            }
          }
        } catch (parseError) {
          console.error(
            `Error parsing JSON for key ${data.key}:`,
            parseError.message
          );
        }
      })
      .on("end", async () => {
        try {
          // Calculate average sales
          response.sales.average = response.sales.quantity
            ? response.sales.totalValue / response.sales.quantity
            : 0;

          // Send response
          res.status(200).json(response);
        } catch (err) {
          console.error("Error finalizing dashboard data:", err.message);
          res.status(500).json({
            error: "Error processing dashboard data",
            details: err.message,
          });
        }
      })
      .on("error", (error) => {
        console.error("Error during read stream:", error);
        res.status(500).json({
          error: "Error reading data from the database",
          details: error.message,
        });
      });
  } catch (error) {
    console.error("Error processing dashboard info:", error);
    res.status(500).json({
      error: "Error processing dashboard info",
      details: error.message,
    });
  }
});

function startServer() {
  app.listen(port, () => {
    console.log(`Worker ${process.pid} running on http://localhost:${port}`);
  });
}

// Function to fork a new worker
function forkWorker() {
  const worker = cluster.fork();
  console.log(`New worker ${worker.process.pid} started`);

  // Listen for exit events
  worker.on("exit", (code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Starting a new worker...`);
    forkWorker();
  });
}

startServer();
const url = `http://localhost:${port}`;
switch (process.platform) {
    case 'win32':
        exec(`start ${url}`);
        break;
    case 'darwin':
        exec(`open ${url}`);
        break;
    case 'linux':
        exec(`xdg-open ${url}`);
        break;
}
require("child_process").execSync("pause");
