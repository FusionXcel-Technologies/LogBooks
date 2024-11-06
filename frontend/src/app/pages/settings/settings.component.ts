import { Component, ElementRef, ViewChild } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  themeForm: any = {
    business_name: 'LogBook',
    business_logo: './favicon.ico',
    favicon: './favicon.ico',
    styles: {
      variables: {
        "primary_color": "#4a90e2",    // Soft blue
        "secondary_color": "#7b8a8b",  // Muted teal gray
        "accent_color": "#f39c12",     // Warm yellow-orange for highlights
        "text_color": "#2c3e50",       // Dark blue-gray for readability
        "background_color": "#ffffff",  // Clean white background
        "background_secondary_color": "#f8f9fa", // Light gray for contrast sections
        "icon_color": "#7f8c8d",       // Subtle gray for icons
        "hover_color": "#3498db",      // Light blue for hover effect
        "font_size": "16px",           // Standard font size
        "font_weight": "400"           // Normal font weight for readability
      }
    }
  };

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadThemeData();
  }

  loadThemeData(): void {
    this.http.get('/read/theme/1').subscribe({
      next: (data: any) => {
        this.themeForm = data;
      },
      error: (err) => {
        console.error('Error fetching theme data:', err);
      }
    });
  }

  @ViewChild('businessLogoInput', { static: false }) businessLogoInput!: ElementRef;
  @ViewChild('faviconInput', { static: false }) faviconInput!: ElementRef;
  @ViewChild('receiptHeaderInput', { static: false }) receiptHeaderInput!: ElementRef;
  @ViewChild('receiptBottomInput', { static: false }) receiptBottomInput!: ElementRef;

  onFileSelected(event: Event, field: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        const imageUrl = reader.result as string; // Get the image URL

        if (field === 'business_logo') {
          this.themeForm.business_logo = imageUrl; // Set business logo
          this.extractDominantColor(imageUrl); // Extract and set dominant color
          this.onInputsChange('business_logo');
        } else if (field === 'favicon') {
          this.themeForm.favicon = imageUrl; // Set favicon
          this.onInputsChange('favicon');
        } else if (field === 'receipt_header') {
          this.themeForm.receipt_header = imageUrl; // Set receipt header
          this.onInputsChange('receipt_header');
        } else if (field === 'receipt_bottom') {
          this.themeForm.receipt_bottom = imageUrl; // Set receipt bottom
          this.onInputsChange('receipt_bottom');
        }
      };

      reader.readAsDataURL(file); // Read file as Data URL
    }
  }

  extractDominantColor(imageUrl: string) {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Handle cross-origin images

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;

      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the image onto the canvas
      context.drawImage(img, 0, 0);

      // Get the pixel data
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const colorCount: { [key: string]: number } = {};
      let maxCount = 0;
      let secondMaxCount = 0;
      let dominantColor = '';
      let secondaryColor = '';


      // Iterate over pixels to count colors
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Skip transparent pixels
        if (data[i + 3] === 0) continue;
        if (r > 230 && g > 230 && b > 230) continue;


        const hex = this.rgbToHex(r, g, b); // Convert RGB to HEX
        // Skip white pixels

        colorCount[hex] = (colorCount[hex] || 0) + 1;

        // Track the most common and second most common colors
        if (colorCount[hex] > maxCount) {
          // Update the secondary color before changing the dominant
          secondaryColor = dominantColor;
          secondMaxCount = maxCount;

          // Update dominant color
          maxCount = colorCount[hex];
          dominantColor = hex;
        } else if (colorCount[hex] > secondMaxCount) {
          // Update the secondary color if it's the second most common
          secondaryColor = hex;
          secondMaxCount = colorCount[hex];
        }
      };


      // Set the dominant and secondary colors in the theme
      this.themeForm.styles.variables.primary_color = dominantColor || '#17a2b8';
      this.applyTheme(this.themeForm)
    };

    img.onerror = (err) => {
      console.error('Error loading image for color extraction:', err);
    };

    img.src = imageUrl;
  }

  rgbToHex(r: number, g: number, b: number): string {
    return `#${this.componentToHex(r)}${this.componentToHex(g)}${this.componentToHex(b)}`;
  }

  private componentToHex(c: number): string {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex; // Ensure two digits
  }

  triggerBusinessLogoInput() {
    this.businessLogoInput.nativeElement.click();
  }

  triggerFaviconInput() {
    this.faviconInput.nativeElement.click();
  }

  triggerReceiptHeaderInput() {
    this.receiptHeaderInput.nativeElement.click();
  }

  triggerReceiptBottomInput() {
    this.receiptBottomInput.nativeElement.click();
  }

  onInputsChange(field: string): void {
    // Update logo in the header and favicon
    if (field === 'business_logo') {
      const headerLogo: HTMLElement | null = document.querySelector('header .left .left-one .logo .logo-img');

      // Ensure the header logo exists before updating its src
      if (headerLogo) {
        const imgElement = headerLogo.querySelector('img') as HTMLImageElement;

        if (imgElement) {
          imgElement.src = this.themeForm.business_logo; // Update the logo's src
        }
      }
    } else if (field === 'favicon') {
      // Update the favicon of the site
      const faviconLink: HTMLLinkElement | null = document.querySelector("link[rel='icon']") || document.createElement('link');

      if (!faviconLink.parentNode) {
        faviconLink.rel = 'icon';
        document.head.appendChild(faviconLink); // Append link element to head if not already present
      }

      faviconLink.href = this.themeForm.favicon; // Set the new favicon source
    }

    this.applyTheme(this.themeForm);
  }

  applyTheme(theme: any) {
    if (!theme || typeof theme !== 'object') return;

    // Ensure theme.styles and theme.styles.variables exist
    if (theme.styles?.variables && typeof theme.styles.variables === 'object') {
      // Replace CSS variables with values from the theme object
      Object.entries(theme.styles.variables).forEach(([key, value]) => {
        if (typeof value === 'string') {
          // Replace underscores in key names with hyphens
          document.documentElement.style.setProperty(`--${key.replace(/_/g, '-')}`, value);
        }
      });
    }
  }

  async saveSettings(): Promise<void> {
    // Save the theme settings in local storage
    localStorage.setItem('theme', JSON.stringify(this.themeForm));
    this.applyTheme(this.themeForm);

    try {
      // Check if the theme exists
      await this.http.get('/read/theme/1').toPromise();

      // Update the existing theme
      this.http.put('/update/theme/1', this.themeForm)
        .subscribe({
          next: (response) => {
            console.log('Theme updated successfully:', response);
            window.location.reload();
          },
          error: (err) => {
            console.error('Error updating theme:', err);
          }
        });
    } catch (error: any) {
      // If theme doesn't exist, create a new theme
      console.log('Theme not found, creating new theme:', error.message);

      this.http.post('/add/theme', { id: 1, ...this.themeForm })
        .subscribe({
          next: (response) => {
            console.log('Theme added successfully:', response);
            window.location.reload();
          },
          error: (err) => {
            console.error('Error adding new theme:', err);
          }
        });
    }
  }
}
