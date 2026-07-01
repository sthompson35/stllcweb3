<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Strategic consulting for bold businesses. Digital transformation, Web3, and technology strategy by Shylow Thompson." />

  <!-- Open Graph -->
  <meta property="og:type"        content="website" />
  <meta property="og:url"         content="https://shylowthompson.com/" />
  <meta property="og:title"       content="Shylow Thompson — Strategic Consulting" />
  <meta property="og:description" content="Strategic consulting for bold businesses. Digital transformation, Web3, and technology strategy." />
  <meta property="og:image"       content="https://shylowthompson.com/og-image.jpg" />

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="Shylow Thompson — Strategic Consulting" />
  <meta name="twitter:description" content="Strategic consulting for bold businesses. Digital transformation, Web3, and technology strategy." />
  <meta name="twitter:image"       content="https://shylowthompson.com/og-image.jpg" />

  <!-- Favicon — ST monogram in gold -->
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='8' fill='%230C0B0A'/><text x='50' y='68' font-size='52' font-family='Georgia,serif' fill='%23C9993A' text-anchor='middle' font-weight='bold'>ST</text></svg>" />

  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "Shylow Thompson Consulting",
    "url": "https://shylowthompson.com",
    "email": "admin@shylowthompson.com",
    "description": "Strategic consulting for bold businesses — digital transformation, Web3, and technology strategy.",
    "founder": {
      "@type": "Person",
      "name": "Shylow Thompson"
    },
    "serviceType": ["Digital Strategy", "Web3 Consulting", "Systems Automation", "Technology Roadmapping"],
    "areaServed": "Worldwide"
  }
  </script>

  <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>

  <!-- NAV -->
  <nav>
    <a href="<?php echo esc_url(home_url('/')); ?>" class="nav-logo">Shylow Thompson</a>
    <ul class="nav-links">
      <li><a href="#about">About</a></li>
      <li><a href="#services">Services</a></li>
      <li><a href="#contact">Contact</a></li>
      <li><a href="/app/" class="btn btn-gold" target="_blank" rel="noopener">Web3 App ↗</a></li>
      <li><a href="https://realtor-agent-3q1p.onrender.com" class="btn btn-gold" target="_blank" rel="noopener">Realtor Agent ↗</a></li>
      <li><a href="#contact" class="btn btn-primary">Work With Me</a></li>
    </ul>
    <!-- Hamburger (mobile) -->
    <button class="nav-hamburger" aria-label="Open menu" aria-expanded="false" onclick="toggleMenu(this)">
      <span></span><span></span><span></span>
    </button>
  </nav>

  <!-- Mobile Drawer -->
  <div id="nav-drawer" class="nav-drawer" role="navigation" aria-label="Mobile menu">
    <a href="#about"   onclick="closeMenu()">About</a>
    <a href="#services" onclick="closeMenu()">Services</a>
    <a href="#contact"  onclick="closeMenu()">Contact</a>
    <a href="/app/"     target="_blank" rel="noopener">Web3 App ↗</a>
    <a href="https://realtor-agent-3q1p.onrender.com" target="_blank" rel="noopener">Realtor Agent ↗</a>
    <a href="#contact"  onclick="closeMenu()" class="btn btn-primary" style="margin-top:0.75rem;text-align:center;">Work With Me</a>
  </div>

  <!-- HERO -->
  <section id="hero">
    <div class="hero-left">
      <p class="hero-eyebrow">Strategic Consulting</p>
      <h1 class="hero-headline">
        Consulting for<br /><em>bold</em><br />businesses.
      </h1>
      <p class="hero-sub">
        We help forward-thinking companies navigate digital transformation, embrace emerging technology, and build for what's next.
      </p>
      <div class="hero-actions">
        <a href="/app/" class="btn btn-primary" target="_blank" rel="noopener">Launch App ↗</a>
        <a href="#services" class="btn btn-outline">View Services</a>
      </div>
      <div class="hero-stat-row">
        <div class="hero-stat">
          <span>Year 1</span>
          <p>& Scaling Fast</p>
        </div>
        <div class="hero-stat">
          <span>5+</span>
          <p>Clients Served</p>
        </div>
        <div class="hero-stat">
          <span>$50K+</span>
          <p>In Deals Closed</p>
        </div>
      </div>
    </div>
    <div class="hero-right">
      <div class="hero-graphic">
        <div class="hero-graphic-content">
          <h3>Transform<br />your digital<br />future.</h3>
          <p>shylowthompson.com</p>
        </div>
      </div>
    </div>
    <!-- Mobile-only hero band -->
    <div class="hero-mobile-band">
      <p>Digital Transformation · Web3 · Strategy</p>
    </div>
  </section>

  <!-- ABOUT -->
  <section id="about">
    <div class="about-inner fade-up">
      <div class="about-photo">
        <!-- Replace this div with an <img> tag once you have a headshot -->
        <div class="about-photo-placeholder">ST</div>
      </div>
      <div class="about-content">
        <p class="section-label">About</p>
        <h2 class="section-title">Built different. Built for what's next.</h2>
        <!-- UPDATE THIS BIO with your real story -->
        <p>Shylow Thompson is a strategic consultant helping bold businesses navigate the intersection of technology, Web3, and real-world execution. With a focus on digital transformation and systems thinking, every engagement is built around one goal: measurable results.</p>
        <p>From smart contract architecture to automated real estate acquisition pipelines, the work spans industries — but the approach stays the same: strategy first, execution always.</p>
        <a href="#contact" class="btn btn-primary" style="margin-top:1rem;">Work With Me →</a>
      </div>
    </div>
  </section>

  <!-- SERVICES -->
  <section id="services">
    <div class="services-header fade-up">
      <div>
        <p class="section-label">What I Do</p>
        <h2 class="section-title">Services built for transformation.</h2>
      </div>
      <p class="section-desc">
        Every engagement is designed to move your business forward — with strategy grounded in reality and execution that delivers measurable results.
      </p>
    </div>
    <div class="services-grid">
      <div class="service-card fade-up">
        <p class="service-num">01</p>
        <div class="service-bar"></div>
        <h3 class="service-name">Digital Strategy</h3>
        <p class="service-desc">Map a clear path from where you are to where you need to be. We align your technology investments with business outcomes that actually matter.</p>
      </div>
      <div class="service-card fade-up">
        <p class="service-num">02</p>
        <div class="service-bar"></div>
        <h3 class="service-name">Web3 &amp; Blockchain</h3>
        <p class="service-desc">Navigate the frontier of decentralized technology. From token strategy to smart contract architecture — built for your business, not the hype.</p>
      </div>
      <div class="service-card fade-up">
        <p class="service-num">03</p>
        <div class="service-bar"></div>
        <h3 class="service-name">Systems &amp; Automation</h3>
        <p class="service-desc">Eliminate friction. Streamline operations and automate the work that doesn't need humans, so your team can focus on what does.</p>
      </div>
      <div class="service-card fade-up">
        <p class="service-num">04</p>
        <div class="service-bar"></div>
        <h3 class="service-name">Technology Roadmapping</h3>
        <p class="service-desc">Complex transformations require clear direction. We build the roadmap, identify the risks, and guide you through execution — step by step.</p>
      </div>
    </div>
  </section>

  <!-- TESTIMONIALS -->
  <section id="testimonials">
    <div class="fade-up">
      <p class="section-label">Social Proof</p>
      <h2 class="section-title">What clients say.</h2>
    </div>
    <div class="testimonials-grid">
      <!-- UPDATE with real client quotes -->
      <div class="testimonial-card fade-up">
        <span class="testimonial-gold">❝</span>
        <p class="testimonial-quote">Working with Shylow completely changed how we think about our technology stack. We went from reactive to strategic in 60 days.</p>
        <div class="testimonial-author">
          <span>Client Name</span>
          <small>CEO, Company Name</small>
        </div>
      </div>
      <div class="testimonial-card fade-up">
        <span class="testimonial-gold">❝</span>
        <p class="testimonial-quote">The Web3 integration roadmap was exactly what we needed — clear, practical, and built for our actual business, not some idealized version of it.</p>
        <div class="testimonial-author">
          <span>Client Name</span>
          <small>Founder, Company Name</small>
        </div>
      </div>
      <div class="testimonial-card fade-up">
        <span class="testimonial-gold">❝</span>
        <p class="testimonial-quote">Shylow doesn't just consult — they build. We now have systems running that we didn't even know were possible six months ago.</p>
        <div class="testimonial-author">
          <span>Client Name</span>
          <small>COO, Company Name</small>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA BAND -->
  <div id="cta-band" class="fade-up">
    <div>
      <p class="section-label">Ready to Begin</p>
      <h2 class="section-title">Let's build something bold together.</h2>
    </div>
    <a href="#contact" class="btn btn-gold" style="padding:1rem 2.5rem;font-size:0.9rem;white-space:nowrap;">
      Start a Conversation →
    </a>
  </div>

  <!-- CONTACT -->
  <section id="contact">
    <div class="contact-inner">
      <div class="fade-up">
        <p class="section-label">Get In Touch</p>
        <h2 class="section-title">Let's talk about your business.</h2>
        <div class="contact-meta">
          <p>Whether you're starting a transformation or looking to accelerate one already in motion, I'd love to hear about your goals.</p>
          <div class="contact-details">
            <div class="contact-item">
              <span>Email</span>
              <a href="mailto:admin@shylowthompson.com">admin@shylowthompson.com</a>
            </div>
            <div class="contact-item">
              <span>Availability</span>
              <p style="font-size:1rem;color:var(--ink);margin:0;">Accepting new clients</p>
            </div>
          </div>
        </div>
      </div>

      <form class="contact-form fade-up" id="contact-form" onsubmit="handleSubmit(event)" novalidate>
        <div class="form-field">
          <label for="contact_name">Your Name</label>
          <input type="text" id="contact_name" name="contact_name" placeholder="Full name" required />
        </div>
        <div class="form-field">
          <label for="contact_email">Email Address</label>
          <input type="email" id="contact_email" name="contact_email" placeholder="you@company.com" required />
        </div>
        <div class="form-field">
          <label for="contact_company">Company</label>
          <input type="text" id="contact_company" name="contact_company" placeholder="Your business" />
        </div>
        <div class="form-field">
          <label for="contact_message">How can I help?</label>
          <textarea id="contact_message" name="contact_message" placeholder="Tell me about your goals..." required></textarea>
        </div>
        <p id="form-status" role="alert"></p>
        <button type="submit" id="form-submit" class="btn btn-primary" style="width:fit-content;">
          Send Message →
        </button>
      </form>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="site-footer">
    <p>© <?php echo date('Y'); ?> Shylow Thompson. All rights reserved.</p>
    <a href="mailto:admin@shylowthompson.com">admin@shylowthompson.com</a>
  </footer>

  <script>
    // Scroll-in animations
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-up').forEach(el => io.observe(el));

    // Hamburger menu
    function toggleMenu(btn) {
      const drawer = document.getElementById('nav-drawer');
      const open   = drawer.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
      btn.classList.toggle('active', open);
    }
    function closeMenu() {
      document.getElementById('nav-drawer').classList.remove('open');
      document.querySelector('.nav-hamburger')?.setAttribute('aria-expanded','false');
      document.querySelector('.nav-hamburger')?.classList.remove('active');
    }

    // Contact form — WordPress AJAX (real email via wp_mail)
    async function handleSubmit(e) {
      e.preventDefault();
      const btn    = document.getElementById('form-submit');
      const status = document.getElementById('form-status');
      status.style.display = 'none';
      btn.disabled = true;
      btn.textContent = 'Sending…';

      const ajax = (typeof shylowAjax !== 'undefined')
        ? shylowAjax
        : { url: '<?php echo esc_js(admin_url("admin-ajax.php")); ?>', nonce: '<?php echo esc_js(wp_create_nonce("shylow_contact_nonce")); ?>' };

      const data = new FormData();
      data.append('action',          'shylow_contact');
      data.append('nonce',           ajax.nonce);
      data.append('contact_name',    document.getElementById('contact_name').value);
      data.append('contact_email',   document.getElementById('contact_email').value);
      data.append('contact_company', document.getElementById('contact_company').value);
      data.append('contact_message', document.getElementById('contact_message').value);

      try {
        const res  = await fetch(ajax.url, { method: 'POST', body: data });
        const json = await res.json();
        status.textContent = json.data || (json.success ? "Message sent — I'll be in touch shortly." : 'Something went wrong.');
        status.style.color   = json.success ? 'var(--gold)' : '#c0392b';
        status.style.display = 'block';
        if (json.success) e.target.reset();
      } catch {
        status.textContent   = 'Network error — please email admin@shylowthompson.com directly.';
        status.style.color   = '#c0392b';
        status.style.display = 'block';
      }

      btn.disabled    = false;
      btn.textContent = 'Send Message →';
    }
  </script>

  <?php wp_footer(); ?>
</body>
</html>
