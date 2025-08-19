# Mobile Notification Plan

This plan outlines the steps to create a notification for mobile users.

## 1. Create the Mobile Notification Component

- Create a new Vue component named `MobileNotification.vue` in `src/components/UIElements/`.
- This component will contain the HTML and CSS for the notification, reusing the styling from `Notifications.vue`.
- The component will include a method to detect if the user is on a mobile device.
- A "close" button will be included to allow users to dismiss the notification.

## 2. Add Logic to Show and Hide the Notification

- The notification should appear only on mobile devices.
- It should be dismissible via a "close" button.
- The notification should reappear on page refresh but not on navigation within the site.

## 3. Integrate the Component

- Import and register the `MobileNotification.vue` component in `App.vue`.
- Add the component to the main layout to ensure it is displayed on all pages.
