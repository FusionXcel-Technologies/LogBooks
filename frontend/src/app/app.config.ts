// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient } from '@angular/common/http'; // Import HttpClient provider
import { routes } from './app.routes'; // Import your routes

// Firebase Imports
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from './environments/environment';
// Import other Firebase services as needed, e.g., provideStorage, getStorage



export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({
      eventCoalescing: true,  // Enable event coalescing for performance optimization
    }),
    provideRouter(
      routes,
      withHashLocation()  // Enable hash-based routing with the 'withHashLocation' function
    ),
    provideHttpClient(),
    // Add Firebase Providers Directly
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    // Add other Firebase providers here, e.g., provideStorage(() => getStorage())
  ]
};
