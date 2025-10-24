import { useEffect } from "react";
import "../assets/css/about.css";

export default function About() {
  useEffect(() => {
    console.log("AgroChain About Page Loaded ✅");

    // ===== MOBILE MENU TOGGLE =====
    const navCenter = document.querySelector(".nav-center");
    const toggleBtn = document.querySelector(".mobile-menu-toggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        navCenter.classList.toggle("active");
        const icon = toggleBtn.querySelector("i");
        if (navCenter.classList.contains("active")) {
          icon.classList.replace("fa-bars", "fa-times");
        } else {
          icon.classList.replace("fa-times", "fa-bars");
        }
      });
    }

    // ===== SMOOTH SCROLL =====
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (!href || href === "#") return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const navbarHeight =
            document.querySelector(".navbar")?.offsetHeight || 0;
          const targetPos =
            target.getBoundingClientRect().top +
            window.scrollY -
            navbarHeight -
            20;
          window.scrollTo({ top: targetPos, behavior: "smooth" });
        }
      });
    });

    // ===== FADE-IN ANIMATIONS =====
    const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    }, observerOptions);

    const cards = document.querySelectorAll(
      ".mission-card, .vision-card, .team-card"
    );
    cards.forEach((card, i) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(30px)";
      card.style.transition = `opacity 0.6s ease ${i * 0.1}s, transform 0.6s ease ${i * 0.1}s`;
      observer.observe(card);
    });

    // ===== TEAM CARD BORDER HOVER =====
    const teamCards = document.querySelectorAll(".team-card");
    teamCards.forEach((card) => {
      card.addEventListener("mouseenter", () => {
        card.style.borderTopColor = "#4caf50";
      });
      card.addEventListener("mouseleave", () => {
        card.style.borderTopColor = "transparent";
      });
    });

    // ===== RIPPLE EFFECT =====
    const socialLinks = document.querySelectorAll(
      ".team-social a, .social-icons a"
    );
    const style = document.createElement("style");
    style.textContent = `
      @keyframes ripple-effect {
        0% {transform: scale(0); opacity: 1;}
        100% {transform: scale(4); opacity: 0;}
      }
      .ripple-effect {
        position: absolute; border-radius: 50%;
        background: rgba(255,255,255,0.5);
        animation: ripple-effect 0.4s linear;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);

    socialLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const ripple = document.createElement("span");
        ripple.className = "ripple-effect";
        const rect = link.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        Object.assign(ripple.style, {
          width: `${size}px`,
          height: `${size}px`,
          left: `${x}px`,
          top: `${y}px`,
        });
        link.style.position = "relative";
        link.style.overflow = "hidden";
        link.querySelector(".ripple-effect")?.remove();
        link.appendChild(ripple);
        ripple.addEventListener("animationend", () => ripple.remove());
      });
    });

    // ===== TITLE CHANGE ON TAB SWITCH =====
    const originalTitle = document.title;
    window.addEventListener("blur", () => {
      document.title = "Come back to AgroChain!";
    });
    window.addEventListener("focus", () => {
      document.title = originalTitle;
    });

    // ===== TEAM LOGGING =====
    const teamObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            console.log(
              `Total Team Members: ${document.querySelectorAll(".team-card").length}`
            );
            teamObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    document
      .querySelectorAll(".team-row-top, .team-row-bottom")
      .forEach((container) => teamObserver.observe(container));
  }, []);

  return (
    <div className="about-page">
      {/* ===== NAVBAR ===== */}
      <nav className="navbar">
        <div className="nav-left">
          <img
            src="https://ik.imagekit.io/a2wpi1kd9/imgToUrl/image-to-url_ThyEiMVLh"
            alt="AgroChain Logo"
            className="logo"
          />
          <span className="brand-name">
            Agro<span className="chain-text">Chain</span>
          </span>
        </div>
        <button className="mobile-menu-toggle" aria-label="Toggle navigation">
          <i className="fas fa-bars"></i>
        </button>
        <div className="nav-center">
          <a href="/" className="nav-link">
            Home
          </a>
          <a href="/about" className="nav-link">
            About
          </a>
          <a href="#features" className="nav-link">
            Features
          </a>
          <a href="#roles" className="nav-link">
            User Roles
          </a>
        </div>
        <div className="nav-right">
          <a href="/login">
            <button className="btn">Log In</button>
          </a>
          <a href="/signup">
            <button className="btn btn-signup">Sign Up</button>
          </a>
        </div>
      </nav>

      {/* ===== HEADER ===== */}
      <header className="about-header">
        <h1>About AgroChain</h1>
        <p>
          Connecting farmers, suppliers, and consumers through trust and
          transparency worldwide
        </p>
      </header>

      {/* ===== OUR STORY ===== */}
      <section className="story-section">
        <div className="story-card">
          <h2>Our Story</h2>
          <div className="underline"></div>
          <p>
            AgroChain was founded in 2025 with a simple mission: to make
            agricultural trade more transparent, fair, and efficient. What
            started as a small idea to connect local farmers with buyers has now
            grown into a trusted platform empowering thousands of agricultural
            producers across the globe.
          </p>
          <p>
            We believe that agriculture is the backbone of our economy – and
            through technology, we aim to make every link in the supply chain
            traceable, reliable, and sustainable. From farmers and wholesalers
            to retailers and consumers, AgroChain ensures that every transaction
            adds value and fosters trust.
          </p>
        </div>
      </section>

      {/* ===== MISSION & VISION ===== */}
      <section className="mission-vision-section">
        <div className="mission-vision-container">
          <div className="mission-card">
            <div className="card-icon">
              <i className="fas fa-bullseye"></i>
            </div>
            <h2>Our Mission</h2>
            <p>
              To revolutionize agricultural trade by providing a platform that
              offers transparency, diversity, and personalized options for every
              stakeholder, while supporting local farmers and sustainable
              farming practices.
            </p>
          </div>
          <div className="vision-card">
            <div className="card-icon">
              <i className="fas fa-eye"></i>
            </div>
            <h2>Our Vision</h2>
            <p>
              We envision a world where agricultural supply chains are seamless,
              where every transaction enhances the journey, and where farmers,
              suppliers, and consumers form meaningful connections that
              transcend traditional trade practices.
            </p>
          </div>
        </div>
      </section>

      {/* ===== TEAM SECTION ===== */}
      <section className="team-section">
        <h2 className="team-title">Meet Our Team</h2>
        <div className="team-underline"></div>

        <div className="team-container team-row-top">
          {[
            {
              name: "B. Sriman Reddy",
              role: "Farmer Experience Lead",
              desc: "Leads the overall AgroChain development team. Designed and built the login and authentication systems, and created the Farmer Dashboard — the heart of the platform.",
              img: "https://i.postimg.cc/ZYMZXdMf/Whats-App-Image-2025-10-15-at-04-04-54-bf405ea2.jpg",
              linkedin:
                "http://www.linkedin.com/in/srimanreddy-bommireddy-b351ab282",
              github: "https://github.com/Sriman2517",
              email: "mailto:srimanreddy.b23@iiits.in",
            },
            {
              name: "A. Palvash Kumar",
              role: "Dealer Operations Lead",
              desc: "Focuses on ensuring dealers have an efficient space to manage their listings and trade with farmers.",
              img: "https://i.postimg.cc/7YNLd6SJ/Whats-App-Image-2025-10-15-at-04-18-15-f80d4e99.jpg",
              linkedin:
                "https://www.linkedin.com/in/palvash-kumar-avasu-7b370228b/",
              github: "https://github.com/Palvash-kumar",
              email: "mailto:palvashkumar.a23@iiits.in",
            },
            {
              name: "A. Anoop",
              role: "Dealer Platform Coordinator",
              desc: "Works closely with Palvash on the Dealer Dashboard and ensures smooth coordination between the dealer and retailer ecosystems.",
              img: "https://ik.imagekit.io/a2wpi1kd9/imgToUrl/image-to-url_maRilyRBx",
              linkedin:
                "http://www.linkedin.com/in/anoop-annapureddy-16a331309",
              github: "https://github.com/Anoopreddy-debug",
              email: "mailto:anoop.a23@iiits.in",
            },
          ].map((m) => (
            <div className="team-card" key={m.name}>
              <div className="team-image">
                <img src={m.img} alt={m.name} />
              </div>
              <div className="team-content">
                <h3>{m.name}</h3>
                <p className="team-role">{m.role}</p>
                <p className="team-description">{m.desc}</p>
                <div className="team-social">
                  <a href={m.linkedin}>
                    <i className="fab fa-linkedin-in"></i>
                  </a>
                  <a href={m.github}>
                    <i className="fab fa-github"></i>
                  </a>
                  <a href={m.email}>
                    <i className="fas fa-envelope"></i>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="team-container team-row-bottom">
          {[
            {
              name: "B. Vishwesh",
              role: "Retail Experience Lead",
              desc: "Handles the Retailer Dashboard and ensures retailers can easily browse and buy products from trusted dealers.",
              img: "https://i.postimg.cc/zXNSZ0Pc/Whats-App-Image-2025-10-15-at-04-30-05-eed46b5a.jpg",
              linkedin: "https://www.linkedin.com/in/vishwesh-boddu-20458a388/",
              github: "https://github.com/vishu2726",
              email: "mailto:vishwesh.b23@iiits.in",
            },
            {
              name: "D. Om Sai",
              role: "System Operations Lead",
              desc: "Oversees the Admin Dashboard, managing analytics, user activities, and platform monitoring.",
              img: "https://ik.imagekit.io/a2wpi1kd9/imgToUrl/image-to-url_UR521elVM",
              linkedin: "https://www.linkedin.com/in/dharavath-sai-baa836320",
              github: "https://github.com/omsai-1",
              email: "mailto:omsai.d23@iiits.in",
            },
          ].map((m) => (
            <div className="team-card" key={m.name}>
              <div className="team-image">
                <img src={m.img} alt={m.name} />
              </div>
              <div className="team-content">
                <h3>{m.name}</h3>
                <p className="team-role">{m.role}</p>
                <p className="team-description">{m.desc}</p>
                <div className="team-social">
                  <a href={m.linkedin}>
                    <i className="fab fa-linkedin-in"></i>
                  </a>
                  <a href={m.github}>
                    <i className="fab fa-github"></i>
                  </a>
                  <a href={m.email}>
                    <i className="fas fa-envelope"></i>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-column">
            <h3>About Us</h3>
            <p>
              We empower farmers and consumers by building a transparent
              agricultural ecosystem. Discover, connect, and trade sustainably
              with AgroChain.
            </p>
          </div>
          <div className="footer-column">
            <h3>Quick Links</h3>
            <ul>
              <li>
                <a href="/">Home</a>
              </li>
              <li>
                <a href="/about">About</a>
              </li>
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#">Privacy Policy</a>
              </li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Contact Us</h3>
            <p>
              <i className="fa-solid fa-location-dot"></i> G05, IIIT Sri City,
              Chittoor, India
            </p>
            <p>
              <i className="fa-solid fa-phone"></i> +91 9876543210
            </p>
            <p>
              <i className="fa-solid fa-envelope"></i> AgroChain@gmail.com
            </p>
          </div>
          <div className="footer-column">
            <h3>Follow Us</h3>
            <div className="social-icons">
              <a href="#">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 AgroChain Website. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
