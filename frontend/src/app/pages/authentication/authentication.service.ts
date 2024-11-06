import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  
  public storedTheme: any;

  constructor(private http: HttpClient) { }

  // Check if the user is logged in and return decrypted user data
  isLoggedIn(): any {
    const token = localStorage.getItem('authToken');

    if (token) {
      try {
        // Decode the token
        const decodedToken: any = jwtDecode(token);
        return decodedToken; // Return the decoded user data
      } catch (error) {
        console.error('Error decoding token', error);
        return false; // Return false if there's an error decoding
      }
    } else {
      console.log('No token found');
      return false; // Return false if the token does not exist
    }
  }

  // Fetch user details from the backend
  getUserDetails(entity: string): Observable<any> {
    const decodedToken = this.isLoggedIn();

    if (decodedToken && decodedToken.id) {
      const userId = decodedToken.id; // Assuming the decoded token contains a user ID
      const url = `http://localhost:7777/read/${entity}/${userId}`; // Construct the API URL for fetching user details with dynamic entity and userId

      return this.http.get(url).pipe(
        catchError((error) => {
          console.error('Error fetching user details:', error);
          return of(null); // Return null if an error occurs
        })
      );
    } else {
      console.log('No valid token found or missing user ID');
      return of(null); // Return null if no valid token or user ID
    }
  }

  // Sign out method
  signOut(): void {
    localStorage.removeItem('authToken');
  }

  // Check if the user has the required permission
  hasPermission(permission: string): Observable<boolean> {
    return this.getUserPermissions().pipe(
      map((permissions: string[]) => {
        return permissions.includes(permission);
      }),
      catchError((error) => {
        console.error('Error checking permission:', error);
        return of(false); // Return false in case of an error
      })
    );
  }

  // Get the list of user permissions

  getUserPermissions(): Observable<string[]> {
    return this.getUserDetails('user').pipe(
      switchMap((userData: any) => {
        console.log('user data', userData);

        if (userData && userData.roles) {
          // Create an array of Observables for fetching permissions based on role IDs
          const roleRequests: Observable<string[]>[] = userData.roles.map((role: any) =>
            this.http.get<{ permissions: string[] }>(`http://localhost:7777/read/roles/${role.id}`).pipe(
              map((roleData) => roleData.permissions || ['signin', 'signup', 'signout']),
              catchError((error) => {
                console.error(`Error fetching permissions for role ${role.id}:`, error);
                return of(['signin', 'signup', 'signout']); // Return empty array on error
              })
            )
          );

          // Combine all role permission Observables and flatten the result
          return forkJoin(roleRequests).pipe(
            map((permissionsArrays: string[][]) => permissionsArrays.flat()) // Flatten the array of permissions
          );
        }

        return of(['signin', 'signup', 'signout']); // Return an Observable of an empty array if no permissions or user data is invalid
      }),
      catchError((error) => {
        console.error('Error fetching user permissions:', error);
        return of(['signin', 'signup', 'signout']); // Return an Observable of an empty array in case of an error
      })
    );
  }


  // Store theme to local storage
  storeTheme(theme: any): void {
    this.storedTheme = theme;
    localStorage.setItem('theme', JSON.stringify(theme));
  }

  // Method to get the stored theme
  getStoredTheme(): any {
    // Check if storedTheme is already set
    if (this.storedTheme) {
      return this.storedTheme;
    }

    // Retrieve from localStorage if not already set
    const themeFromStorage = localStorage.getItem('theme');
    this.storedTheme = themeFromStorage ? JSON.parse(themeFromStorage) : null;

    return this.storedTheme;
  }

}
