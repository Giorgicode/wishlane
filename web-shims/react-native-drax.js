import React from 'react';
import { ScrollView, View } from 'react-native';

// Minimal web shim for react-native-drax to avoid react-native-web findNodeHandle issues.
// This provides very basic behavior: DraxProvider just renders children, DraxView is a View,
// and DraxScrollView is a ScrollView. It intentionally does not implement drag-and-drop.

export const DraxProvider = ({ children }) => React.createElement(React.Fragment, null, children);
export const DraxView = (props) => React.createElement(View, props, props.children);
export const DraxScrollView = (props) => React.createElement(ScrollView, props, props.children);

export default DraxProvider;
