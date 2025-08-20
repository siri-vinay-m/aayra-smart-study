import React from 'react';

/**
 * Simple test page to verify React is working
 */
const TestPage: React.FC = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Test Page</h1>
      <p>If you can see this, React is working!</p>
      <button onClick={() => alert('Button clicked!')}>Test Button</button>
    </div>
  );
};

export default TestPage;