# Voice Assistance Implementation Prompt

## Objective
Create a comprehensive voice assistance system for our application that reads out elements when users hover over them, with proper accessibility settings and smooth transitions between elements.

## Requirements

### Accessibility Settings Panel
1. Create a dedicated accessibility settings panel where users can:
   - Toggle voice assistance on/off
   - Adjust speech rate, pitch, and volume
   - Set delay before speech begins on hover
   - Choose preferred voice (if multiple are available)

### Voice Assistance Behavior
1. When enabled, the system should:
   - Read text content when a user hovers over an element
   - Immediately stop current speech and begin reading new content when user moves to another element
   - Prioritize accessibility attributes (aria-label, alt text) over raw text content
   - Provide appropriate feedback for interactive elements (buttons, links, inputs)

### Technical Implementation
1. Utilize the provided `useElementSpeech` hook as the foundation
2. Ensure speech synthesis works across browsers with proper fallbacks
3. Handle component mounting/unmounting gracefully to prevent speech overlap
4. Implement proper user interaction detection to comply with browser autoplay policies
5. Add appropriate ARIA attributes to enhance accessibility

### User Experience Considerations
1. Add visual indicators when voice assistance is active
2. Provide clear instructions for enabling voice assistance
3. Ensure minimal delay between hovering and speech beginning
4. Handle focus states for keyboard navigation
5. Implement proper error handling with user-friendly messages

## Implementation Guidelines

1. Use the existing `useElementSpeech` hook and extend it with the following:
   - Settings persistence (localStorage)
   - Voice selection capability
   - Improved element text extraction logic

2. Create a `SpeakableElement` wrapper component that:
   - Can be easily applied to any element requiring voice assistance
   - Handles hover/focus events automatically
   - Supports custom text override
   - Includes disable option for specific elements

3. Develop an AccessibilityPanel component that:
   - Provides intuitive controls for all speech settings
   - Includes a test area for users to verify settings
   - Saves preferences for returning users

4. Add proper logging for debugging and analytics:
   - Track usage patterns
   - Identify potential issues
   - Monitor performance metrics

## Testing Requirements
1. use this in the entire frontend and make everything accessible


## Accessibility Compliance
Ensure the implementation meets WCAG 2.1 AA standards, particularly:
- 1.3.1 Info and Relationships
- 2.1.1 Keyboard
- 2.5.3 Label in Name
- 4.1.2 Name, Role, Value

This voice assistance system should seamlessly integrate with our existing application while providing valuable accessibility features for all users.

