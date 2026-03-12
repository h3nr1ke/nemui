import React from 'react';

const features = [
  {
    icon: '⚡',
    iconClass: 'blue',
    title: 'REST & GraphQL',
    description: 'Full support for REST APIs and GraphQL queries. Send requests, inspect responses, and debug with ease.'
  },
  {
    icon: '🌍',
    iconClass: 'green',
    title: 'Environments & Variables',
    description: 'Manage multiple environments with reusable variables. Switch between dev, staging, and production seamlessly.'
  },
  {
    icon: '📜',
    iconClass: 'purple',
    title: 'Pre & Post Scripts',
    description: 'Write JavaScript scripts to execute before requests or after responses. Automate workflows and dynamic testing.'
  },
  {
    icon: '📦',
    iconClass: 'orange',
    title: 'Import & Export',
    description: 'Import from Insomnia, Postman, or OpenAPI. Export your collections anytime for backup or sharing.'
  },
  {
    icon: '📁',
    iconClass: 'blue',
    title: 'Projects & Collections',
    description: 'Organize your API calls into collections and projects. Keep your work structured and findable.'
  },
  {
    icon: '🔌',
    iconClass: 'green',
    title: 'Multiple Auth Types',
    description: 'Bearer tokens, Basic auth, API keys — all supported. Secure your requests without the hassle.'
  }
];

function App() {
  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <a href="/" className="logo">
          <div className="logo-icon">N</div>
          Nemui
        </a>
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#platforms">Platforms</a></li>
          <li><a href="https://github.com/h3nr1ke/nemui" target="_blank" rel="noopener noreferrer">GitHub</a></li>
        </ul>
        <div className="nav-buttons">
          <a href="https://github.com/h3nr1ke/nemui" target="_blank" rel="noopener noreferrer" className="btn btn-outline">
            ⭐ Star on GitHub
          </a>
          <a href="#platforms" className="btn btn-primary">
            Download
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">
          <span>●</span> Open Source API Client
        </div>
        <h1>
          The API Client<br />
          <span className="highlight">You Actually Want</span>
        </h1>
        <p>
          A powerful REST & GraphQL API client that works as a VSCode extension 
          and standalone web app. Beautiful, fast, and built for developers.
        </p>
        <div className="hero-buttons">
          <a href="#platforms" className="btn btn-primary">
            Get Started — It's Free
          </a>
          <a href="https://github.com/h3nr1ke/nemui" target="_blank" rel="noopener noreferrer" className="btn btn-outline">
            View on GitHub
          </a>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <div className="stat-value">2</div>
            <div className="stat-label">Platforms</div>
          </div>
          <div className="stat">
            <div className="stat-value">MIT</div>
            <div className="stat-label">License</div>
          </div>
          <div className="stat">
            <div className="stat-value">100%</div>
            <div className="stat-label">Free Forever</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <div className="section-header">
          <h2>Everything You Need</h2>
          <p>A complete API testing solution with all the features developers expect, minus the bloat.</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div className="feature-card" key={index}>
              <div className={`feature-icon ${feature.iconClass}`}>
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Platforms */}
      <section className="platforms" id="platforms">
        <div className="section-header">
          <h2>Works Where You Work</h2>
          <p>Choose how you want to use Nemui — in your editor or in the browser.</p>
        </div>
        <div className="platforms-grid">
          <div className="platform-card">
            <div className="platform-icon">📱</div>
            <h3>VSCode Extension</h3>
            <p>Use Nemui directly inside VSCode. Perfect for developers who never leave their editor. Install from the VSCode Marketplace.</p>
            <a href="https://marketplace.visualstudio.com/items?itemName=nemui.nemui" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              Install from VSCode
            </a>
          </div>
          <div className="platform-card">
            <div className="platform-icon">🌐</div>
            <h3>Standalone Web App</h3>
            <p>Use Nemui in any browser. No installation needed. Perfect for quick testing or teams without VSCode.</p>
            <a href="https://nemui.vercel.app" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              Open Web App
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2>Ready to Try?</h2>
        <p>Start testing APIs in seconds. No sign-up, no accounts, no nonsense.</p>
        <div className="hero-buttons" style={{ justifyContent: 'center' }}>
          <a href="#platforms" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '16px' }}>
            Get Started Now
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="logo" style={{ fontSize: '20px' }}>
            <div className="logo-icon" style={{ width: '28px', height: '28px', fontSize: '14px' }}>N</div>
            Nemui
          </div>
          <ul className="footer-links">
            <li><a href="https://github.com/h3nr1ke/nemui" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            <li><a href="https://github.com/h3nr1ke/nemui/issues" target="_blank" rel="noopener noreferrer">Issues</a></li>
            <li><a href="https://github.com/h3nr1ke/nemui/releases" target="_blank" rel="noopener noreferrer">Releases</a></li>
          </ul>
          <p>MIT License © 2024</p>
        </div>
      </footer>
    </>
  );
}

export default App;
