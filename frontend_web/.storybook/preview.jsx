import React from 'react';
import './preview.css';
import '../src/index.css';

/** Tema oscuro MetaFit por defecto en todas las historias. */
const withMetaFitTheme = (Story, context) => {
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);
  return <Story {...context} />;
};

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  decorators: [withMetaFitTheme],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo"
    }
  },
};

export default preview;