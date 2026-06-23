// Nav scroll state
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

// Mobile burger
const burger = document.querySelector('.nav__burger');
const links  = document.querySelector('.nav__links');
if (burger) {
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    links.classList.toggle('open');
    document.body.style.overflow = links.classList.contains('open') ? 'hidden' : '';
  });
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      burger.classList.remove('open');
      links.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// Reveal on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Contact form (static — shows confirmation)
const form = document.querySelector('.js-contact-form');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    form.innerHTML = `<p style="font-family:var(--ff-serif);font-size:1.4rem;line-height:1.4">Gracias por tu mensaje.<br><em>Te escribo pronto.</em></p>`;
  });
}
