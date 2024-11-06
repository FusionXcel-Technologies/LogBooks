import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Function to set page opacity
function setPageOpacity(opacity: string) {
  document.body.style.opacity = opacity;
}

// Variable to track inactivity timer
let inactivityTimer: any;

// Function to reset the inactivity timer
function resetInactivityTimer() {
  // Clear any existing timer
  if (inactivityTimer) clearTimeout(inactivityTimer);

  // Set opacity to full and reset the timer
  setPageOpacity('1');
  inactivityTimer = setTimeout(() => {
    setPageOpacity('0.6'); // Reduce opacity after 3 seconds of inactivity
  }, 3000); // 3 seconds
}

// Add event listeners for focus, blur, and user activity
window.addEventListener('focus', () => {
  setPageOpacity('1'); // Full opacity when focused
  resetInactivityTimer();
});

window.addEventListener('blur', () => {
  setPageOpacity('0.6'); // Reduced opacity when not focused
});

// Listen to user activity events to reset the timer
['mousemove', 'keydown', 'scroll', 'click'].forEach((event) => {
  window.addEventListener(event, resetInactivityTimer);
});

// Bootstrap the Angular application
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
