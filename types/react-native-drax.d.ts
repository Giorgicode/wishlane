declare module 'react-native-drax' {
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';

  export const DraxProvider: ComponentType<ViewProps>;
  export const DraxView: ComponentType<any>;
  export const DraxScrollView: ComponentType<any>;

  export default DraxProvider;
}
