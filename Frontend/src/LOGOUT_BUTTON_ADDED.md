# Logout Button Implementation

## Overview
Added a prominent logout button to the sidebar for easy user session management.

## Changes Made

### 1. Sidebar Component (`/components/sidebar.tsx`)
- Added `LogOut` icon from lucide-react
- Added new props:
  - `userName?: string` - Display user's full name
  - `userEmail?: string` - Display user's email address
  - `onLogout?: () => void` - Handler for logout action
- Updated User Profile section at bottom of sidebar with:
  - User avatar with cyan gradient background
  - User name and email display
  - Logout button with icon

### 2. App.tsx (`/App.tsx`)
- Passed user information to Sidebar:
  - `userName={user?.name}`
  - `userEmail={user?.email}`
  - `onLogout={logout}`

## Visual Design

### User Profile Section
```
┌──────────────────────────────┐
│ [Avatar] John Doe            │
│          john@example.com    │
│ ┌──────────────────────────┐ │
│ │  [Icon] Logout           │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

**Features:**
- Gradient cyan avatar icon
- User name in medium font weight
- Email in smaller, lighter text
- Clean bordered logout button
- Hover state with light gray background
- LogOut icon for visual clarity

## Button Styling
- White background with gray border
- Dark gray text
- Hover effects:
  - Light gray background
  - Darker border
- Smooth transitions
- Full width button
- Flexbox centering with icon + text

## Location
The logout button is located at the **bottom of the sidebar**, below:
1. Logo
2. Role Selector
3. Search Bar
4. Navigation Menu
5. AI Assistant Card
6. **User Profile** ← Logout button is here

## Functionality
When clicked:
1. Calls the `logout()` function from `useAuth()`
2. Clears user session and tokens
3. Redirects to login page
4. Removes user data from context

## User Experience Flow

### Before Logout
```
User is logged in → See full sidebar with navigation → Profile shows at bottom
```

### Click Logout
```
Click logout button → Session cleared → Redirect to login page
```

### After Logout
```
Login page shown → Previous session fully cleared → Can login again
```

## Security Features
- Logout clears all authentication tokens
- Removes user data from memory
- Invalidates session
- No residual user data remains

## Testing

### To Test Logout:
1. Login with any test account (e.g., `coder@medcoding.com` / `Coder123!`)
2. Navigate to any page
3. Scroll to bottom of sidebar
4. See your name and email displayed
5. Click "Logout" button
6. Verify you're redirected to login page
7. Verify you cannot access protected pages without logging in again

### Test Accounts:
- `coder@medcoding.com` / `Coder123!`
- `billing@medcoding.com` / `Billing123!`
- `manager@medcoding.com` / `Manager123!`

## Code Examples

### Sidebar Props
```typescript
interface SidebarProps {
  // ... existing props
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
}
```

### Usage in App.tsx
```typescript
<Sidebar
  // ... existing props
  userName={user?.name}
  userEmail={user?.email}
  onLogout={logout}
/>
```

### User Profile Section
```tsx
<div className="p-4 border-t border-gray-200">
  <div className="flex items-center gap-3 mb-2">
    <div className="w-10 h-10 bg-gradient-to-br from-[#62d5e4] to-[#4bc5d6] rounded-full flex items-center justify-center">
      <User className="w-5 h-5 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 truncate">{userName || 'User'}</p>
      <p className="text-xs text-gray-500 truncate">{userEmail || ''}</p>
    </div>
  </div>
  {onLogout && (
    <button
      onClick={onLogout}
      className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
    >
      <LogOut className="w-4 h-4" />
      Logout
    </button>
  )}
</div>
```

## Benefits

1. **Easy Access**: Users can quickly logout from any page
2. **Clear Identity**: Shows who is currently logged in
3. **Visual Feedback**: Clear button with icon and text
4. **Secure**: Properly clears session on logout
5. **Professional**: Matches the platform's design system
6. **Accessible**: Large click target, clear labeling

## Design Consistency
- Uses platform's cyan color palette for avatar
- Matches existing button styling patterns
- Consistent spacing and padding
- Follows layout hierarchy
- Uses lucide-react icons like rest of app

## Future Enhancements
- Add user avatar image upload
- Add "My Profile" link above logout
- Add "Settings" quick access
- Add session timeout warning
- Add "Switch Account" for multi-org users
