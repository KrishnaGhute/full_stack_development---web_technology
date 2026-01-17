// script.js — Consolidated site script: recipes, modal, mobile nav, and contact feedback
(function(){
  'use strict';

  // Small helpers
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  // Year filler
  function setYears(){ document.querySelectorAll('[id^="year"]').forEach(el=>el.textContent=new Date().getFullYear()); }
  setYears();

  // Mobile nav toggle
  const mobileToggle = $('#mobile-toggle');
  if(mobileToggle) mobileToggle.addEventListener('click', ()=>document.documentElement.classList.toggle('nav-open'));

  // Highlight current nav link
  (function highlightNav(){
    const path = location.pathname.split('/').pop() || 'index.html';
    const links = $$('.nav-links a');
    links.forEach(a=>{
      const href = a.getAttribute('href');
      if(!href) return;
      if(href === path || (href==='index.html' && path==='')){
        a.classList.add('active');
      }
    });
  })();

  // Image fallback for any broken image
  (function imageFallback(){
    const fallback = 'https://via.placeholder.com/800x450?text=Image+not+available';
    $$('img').forEach(img=>{
      img.addEventListener('error', function(){ if(this.src !== fallback) this.src = fallback; });
    });
  })();

  // Normalize YouTube URLs to embed form
  function normalizeYouTube(url){
    if(!url) return '';
    try{
      // If already an embed URL, return as-is
      const embedMatch = url.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/i);
      if(embedMatch) return 'https://www.youtube.com/embed/' + embedMatch[1];

      // youtu.be short link
      const shortMatch = url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/i);
      if(shortMatch) return 'https://www.youtube.com/embed/' + shortMatch[1];

      // watch?v= style
      const watchMatch = url.match(/[?&]v=([A-Za-z0-9_-]{6,})/i);
      if(watchMatch) return 'https://www.youtube.com/embed/' + watchMatch[1];

      // fallback: try to extract last path segment as id
      const pathId = url.split('/').pop().split('?')[0];
      if(pathId && pathId.length>=6) return 'https://www.youtube.com/embed/' + pathId;
    }catch(e){/* ignore */}
    return url;
  }

const recipes = [
  {
    id: 'paneer',
    name: 'Paneer Butter Masala',
    image: 'https://i0.wp.com/aartimadan.com/wp-content/uploads/2023/11/Paneer-Butter-Masala-Restaurant-Style.jpg?fit=800%2C449&ssl=1',
    time: '30 mins',
    serves: '3-4',
    ingredients: ['250g paneer','2 tbsp butter','2 cups tomato puree','1 tsp garam masala','salt to taste','1/2 cup cream'],
    steps: [
      'Heat butter and gently sauté aromatics.',
      'Add tomato puree and simmer until thickened.',
      'Add spices and paneer cubes; simmer to absorb flavors.',
      'Finish with cream and garnish with kasuri methi.'
    ],
    video: 'https://www.youtube.com/embed/U1LVDFwi8qI'
  },
  {
    id: 'biryani',
    name: 'Chicken Biryani',
    image: 'https://www.shutterstock.com/image-photo/traditional-chicken-biryani-served-brass-600nw-2622739739.jpg',
    time: '75 mins',
    serves: '4',
    ingredients: ['500g chicken','2 cups basmati rice','2 onions','yogurt','biryani masala','saffron (optional)'],
    steps: [
      'Marinate chicken with spices and yogurt.',
      'Partially cook rice and layer with marinated chicken.',
      'Cook on low heat (dum) until rice and meat finish.',
      'Garnish with fried onions and coriander.'
    ],
    video: 'https://www.youtube.com/embed/VSe-u39_ENU'
  },
  {
    id: 'dosa',
    name: 'Masala Dosa',
    image: 'https://media.istockphoto.com/id/1413555828/photo/crispy-masala-dosa-is-a-popular-south-indian-food-item-served-with-tomato-chutney-coconut.jpg?s=612x612&w=0&k=20&c=4bc2ZpJ7WrS2eLAjEzkLjNE3LPPqZTQLEvu0mU_BHOA=',
    time: '45 mins',
    serves: '2-3',
    ingredients: ['Dosa batter','potatoes','mustard seeds','turmeric','green chili'],
    steps: [
      'Prepare spiced potato filling.',
      'Heat skillet and spread dosa batter thinly.',
      'Place filling and fold; serve with chutney and sambar.'
    ],
    video: 'https://www.youtube.com/embed/mDqkxZ3UVzc'
  },
  {
    id: 'chole',
    name: 'Chole Bhature',
    image: 'https://t3.ftcdn.net/jpg/16/45/73/24/360_F_1645732460_9OYHQIkaQWjF9ZBVKvOizzjJS9zJhgQ8.jpg',
    time: '60 mins',
    serves: '3',
    ingredients: ['Chickpeas','onion','tomato','spices','flour for bhature'],
    steps: [
      'Soak and pressure cook chickpeas.',
      'Prepare spicy onion-tomato masala and simmer with chickpeas.',
      'Serve with hot bhature (fried bread).'
    ],
    video: 'https://www.youtube.com/embed/QbyXsYOTJD4'
  },
  {
    id: 'rajma',
    name: 'Rajma Chawal',
    image: 'https://www.shutterstock.com/image-photo/rajma-curry-popular-north-indian-260nw-1894305070.jpg',
    time: '60 mins',
    serves: '4',
    ingredients: ['Red kidney beans','onion','tomato','spices'],
    steps: [
      'Soak and pressure cook rajma until soft.',
      'Prepare gravy and simmer rajma until thick and flavorful.'
    ],
    video: 'https://www.youtube.com/embed/M_ncAJhIaIU'
  },
  {
    id: 'palak',
    name: 'Palak Paneer',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTH_DiTDlIMrrunji-AQ9P-qyK445J27gkTtQ&s',
    time: '35 mins',
    serves: '3',
    ingredients: ['Spinach','paneer','onion','garlic','spices'],
    steps: [
      'Blanch and puree spinach.',
      'Cook with aromatics and spices, add paneer, simmer briefly.'
    ],
    video: 'https://www.youtube.com/embed/vCDy7vjbz_M'
  },
  {
    id: 'gulab',
    name: 'Gulab Jamun',
    image: 'https://www.indianhealthyrecipes.com/wp-content/uploads/2021/11/gulab-jamun.jpg',
    time: '60 mins',
    serves: '6',
    ingredients: ['Milk powder','flour','sugar','cardamom'],
    steps: [
      'Make soft dough, shape into balls.',
      'Fry gently and soak in warm sugar-cardamom syrup.'
    ],
    video: 'https://www.youtube.com/embed/QFvd7u_YjVk'
  },
  {
    id: 'naan',
    name: 'Butter Naan',
    image: 'https://jalojog.com/wp-content/uploads/2024/04/Butter_Naan.jpg',
    time: '40 mins',
    serves: '4',
    ingredients: ['Flour','yeast','yogurt','butter'],
    steps: [
      'Prepare soft dough and let it rest.',
      'Roll and cook on skillet or tandoor; brush with butter.'
    ],
    video: 'https://www.youtube.com/embed/H3tW-UFSojU'
  }
];




  // Create quick lookup map
  const recipeMap = recipes.reduce((m,r)=>{ m[r.id]=r; return m; }, {});

  // Modal elements
  const modal = $('#recipe-modal');
  const modalDialog = modal ? modal.querySelector('.modal-dialog') : null;
  const modalTitle = $('#modal-title');
  const modalImg = $('#modal-img');
  const modalMeta = $('#modal-meta');
  const modalIngredients = $('#modal-ingredients');
  const modalSteps = $('#modal-steps');
  const modalVideo = $('#modal-video');
  const modalClose = modal ? modal.querySelector('.modal-close') : null;

  function clearModal(){
    if(modalImg) modalImg.src = '';
    if(modalTitle) modalTitle.textContent = '';
    if(modalMeta) modalMeta.textContent = '';
    if(modalIngredients) modalIngredients.innerHTML = '';
    if(modalSteps) modalSteps.innerHTML = '';
    if(modalVideo){ modalVideo.innerHTML=''; modalVideo.setAttribute('aria-hidden','true'); }
  }

  function openModal(id){
    const r = recipeMap[id];
    if(!r || !modal) return;
    clearModal();
    if(modalTitle) modalTitle.textContent = r.name;
    if(modalImg){ modalImg.src = r.image; modalImg.alt = r.name; }
    if(modalMeta) modalMeta.textContent = `Time: ${r.time} • Serves: ${r.serves}`;
    if(modalIngredients) r.ingredients.forEach(it=>{ const li=document.createElement('li'); li.textContent = it; modalIngredients.appendChild(li); });
    if(modalSteps) r.steps.forEach(st=>{ const li=document.createElement('li'); li.textContent = st; modalSteps.appendChild(li); });

    // Inject iframe
    if(modalVideo){
      const iframe = document.createElement('iframe');
      const base = normalizeYouTube(r.video) || r.video || '';
      iframe.src = base + (base.includes('?') ? '&' : '?') + 'rel=0&modestbranding=1&autoplay=1';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.setAttribute('loading','lazy');
      iframe.setAttribute('title', r.name + ' — video');
      iframe.setAttribute('allowfullscreen','');
      modalVideo.appendChild(iframe);
      modalVideo.setAttribute('aria-hidden','false');
    }

    modal.setAttribute('aria-hidden','false');
    document.documentElement.classList.add('overlay-open');
    document.body.style.overflow = 'hidden';
    if(modalDialog) modalDialog.focus();
  }

  function closeModal(){
    if(!modal) return;
    modal.setAttribute('aria-hidden','true');
    document.documentElement.classList.remove('overlay-open');
    document.body.style.overflow = '';
    clearModal();
  }

  // Attach click handlers to cards
  $$('.recipe-card').forEach(card=>{
    card.addEventListener('click', function(e){
      const id = this.dataset.id;
      if(!id) return;
      openModal(id);
    });
  });

  // Close handlers
  if(modalClose) modalClose.addEventListener('click', closeModal);
  if(modal) modal.addEventListener('click', function(e){ if(e.target===modal) closeModal(); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeModal(); });

// Contact form submission
const contactForm = document.getElementById("contact-form");

if (contactForm) {
    const feedback = document.getElementById("contact-feedback");

    contactForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const formData = new FormData(contactForm);

        let response = await fetch("contact.php", {
            method: "POST",
            body: formData
        });

        let result = await response.json();

        if (result.status === "success") {
            feedback.textContent = result.message;
            feedback.className = "feedback-message green";
            contactForm.reset();
        } else {
            feedback.textContent = result.message;
            feedback.className = "feedback-message red";
        }
    });
}



  // Sticky header shadow on scroll
  (function stickyHeader(){
    const header = document.querySelector('.site-header');
    if(!header) return;
    const onScroll = ()=>{
      if(window.scrollY > 8) header.classList.add('scroll-shadow'); else header.classList.remove('scroll-shadow');
    };
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  })();

  // Animate on scroll using IntersectionObserver
  (function animateOnScroll(){
    const items = $$('.animate-on-scroll');
    if(items.length===0) return;
    if('IntersectionObserver' in window){
      const obs = new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){ entry.target.classList.add('in-view'); obs.unobserve(entry.target); }
        });
      },{threshold:0.12});
      items.forEach(i=>obs.observe(i));
    } else {
      // fallback: reveal all
      items.forEach(i=>i.classList.add('in-view'));
    }
  })();

})();
// script.js — handles mobile nav, recipe modals and contact form
(function(){
  // Year fillers
  function setYears(){
    document.querySelectorAll('[id^="year"]').forEach(el=>el.textContent=new Date().getFullYear());
  }
  setYears();

  // Mobile nav toggle
  const mobileToggleBtns = document.querySelectorAll('#mobile-toggle');
  mobileToggleBtns.forEach(btn => {
    btn.addEventListener('click', ()=> document.documentElement.classList.toggle('nav-open'));
  });

 // Updated Recipe Data (with images, videos & full details)
const recipes = {
  paneer: {
    title: 'Paneer Butter Masala',
    img: 'https://i0.wp.com/aartimadan.com/wp-content/uploads/2023/11/Paneer-Butter-Masala-Restaurant-Style.jpg?fit=800%2C449&ssl=1',
    time: '30 mins',
    serves: '3-4',
    ingredients: [
      '250g paneer',
      '2 tbsp butter',
      '2 cups tomato puree',
      '1 tsp garam masala',
      'Salt to taste',
      '1/2 cup cream'
    ],
    steps: [
      'Heat butter and sauté ginger-garlic paste until aromatic.',
      'Add tomato puree and cook until thickened.',
      'Mix in garam masala and salt; simmer for 5 minutes.',
      'Add paneer cubes and cook for 8 minutes on low heat.',
      'Finish with cream and garnish with kasuri methi or coriander.'
    ],
    video: 'https://www.youtube.com/embed/v_MpI4F2pZ8'
  },

  biryani: {
    title: 'Chicken Biryani',
    img: 'https://www.shutterstock.com/image-photo/traditional-chicken-biryani-served-brass-600nw-2622739739.jpg',
    time: '75 mins',
    serves: '4',
    ingredients: [
      '500g chicken',
      '2 cups basmati rice',
      '2 onions (fried)',
      '1/2 cup yogurt',
      '2 tbsp biryani masala',
      'Saffron (optional)',
      'Coriander and mint leaves'
    ],
    steps: [
      'Marinate chicken with yogurt, masala, and salt for 30 minutes.',
      'Partially cook rice with whole spices and drain.',
      'Layer rice and chicken alternately in a pot.',
      'Seal and cook on low flame (dum) for 25 minutes.',
      'Garnish with fried onions and coriander before serving.'
    ],
    video: 'https://youtu.be/VSe-u39_ENU?si=_7qtswO1ZH4jekx-'
  },

  dosa: {
    title: 'Masala Dosa',
    img: 'https://media.istockphoto.com/id/1413555828/photo/crispy-masala-dosa-is-a-popular-south-indian-food-item-served-with-tomato-chutney-coconut.jpg?s=612x612&w=0&k=20&c=4bc2ZpJ7WrS2eLAjEzkLjNE3LPPqZTQLEvu0mU_BHOA=',
    time: '45 mins',
    serves: '2-3',
    ingredients: [
      '2 cups dosa batter',
      '3 boiled potatoes',
      '1 tsp mustard seeds',
      '1/2 tsp turmeric',
      '2 green chilies',
      'Few curry leaves'
    ],
    steps: [
      'Prepare spiced mashed potato filling.',
      'Heat skillet, spread dosa batter thinly, drizzle oil.',
      'Add filling in center, fold and serve hot with chutney & sambar.'
    ],
    video: 'https://www.youtube.com/embed/mDqkxZ3UVzc'
  },

  chole: {
    title: 'Chole Bhature',
    img: 'https://t3.ftcdn.net/jpg/16/45/73/24/360_F_1645732460_9OYHQIkaQWjF9ZBVKvOizzjJS9zJhgQ8.jpg',
    time: '60 mins',
    serves: '3',
    ingredients: [
      '1 cup chickpeas (soaked overnight)',
      '2 onions',
      '2 tomatoes',
      'Chole masala powder',
      'Salt to taste',
      'Flour for bhature'
    ],
    steps: [
      'Boil chickpeas until soft.',
      'Prepare onion-tomato gravy with spices.',
      'Add chickpeas and cook for 10–15 minutes.',
      'Serve with fried bhature and pickle.'
    ],
    video: 'https://www.youtube.com/embed/QbyXsYOTJD4'
  },

  rajma: {
    title: 'Rajma Chawal',
    img: 'https://www.shutterstock.com/image-photo/rajma-curry-popular-north-indian-260nw-1894305070.jpg',
    time: '60 mins',
    serves: '4',
    ingredients: [
      '1 cup red kidney beans (soaked overnight)',
      '2 onions',
      '2 tomatoes',
      'Garam masala, cumin, coriander powder',
      'Salt to taste'
    ],
    steps: [
      'Pressure cook soaked rajma until soft.',
      'Prepare onion-tomato gravy with spices.',
      'Add rajma and simmer for 15 minutes.',
      'Serve hot with steamed rice.'
    ],
    video: 'https://www.youtube.com/embed/M_ncAJhIaIU'
  },

  palak: {
    title: 'Palak Paneer',
    img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTH_DiTDlIMrrunji-AQ9P-qyK445J27gkTtQ&s',
    time: '35 mins',
    serves: '3',
    ingredients: [
      '2 cups spinach leaves',
      '200g paneer',
      '1 onion',
      '4 garlic cloves',
      'Cumin seeds, salt, spices'
    ],
    steps: [
      'Blanch spinach, cool, and blend to a puree.',
      'Sauté garlic and onion, add spinach puree.',
      'Mix paneer cubes and cook for 5–6 minutes.',
      'Serve with roti or naan.'
    ],
    video: 'https://www.youtube.com/embed/vCDy7vjbz_M'
  },

  gulab: {
    title: 'Gulab Jamun',
    img: 'https://www.indianhealthyrecipes.com/wp-content/uploads/2021/11/gulab-jamun.jpg',
    time: '60 mins',
    serves: '6',
    ingredients: [
      '1 cup milk powder',
      '1/4 cup flour',
      '1/4 tsp baking soda',
      'Ghee for frying',
      '1 cup sugar',
      '1 cup water',
      'Cardamom pods'
    ],
    steps: [
      'Mix dry ingredients, form soft dough with milk.',
      'Shape into smooth balls and fry on low heat until golden.',
      'Boil sugar and water to make syrup, add cardamom.',
      'Soak fried balls in warm syrup for at least 30 minutes.'
    ],
    video: 'https://www.youtube.com/embed/QFvd7u_YjVk'
  },

  naan: {
    title: 'Butter Naan',
    img: 'https://jalojog.com/wp-content/uploads/2024/04/Butter_Naan.jpg',
    time: '40 mins',
    serves: '4',
    ingredients: [
      '2 cups flour',
      '1 tsp yeast',
      '2 tbsp yogurt',
      '1 tbsp oil',
      'Butter for brushing'
    ],
    steps: [
      'Knead dough with warm water, yeast, and yogurt; rest 1 hour.',
      'Roll out naan and cook on hot skillet/tandoor until bubbles form.',
      'Flip, cook other side, and brush with melted butter.'
    ],
    video: 'https://www.youtube.com/embed/H3tW-UFSojU'
  }
};


  // Modal logic
  const modal = document.getElementById('recipe-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalImg = document.getElementById('modal-img');
  const modalMeta = document.getElementById('modal-meta');
  const modalIngredients = document.getElementById('modal-ingredients');
  const modalSteps = document.getElementById('modal-steps');
  const modalClose = document.querySelector('.modal-close');

  function openModal(id){
    const r = recipes[id];
    if(!r) return;
    modalTitle.textContent = r.title;
    modalImg.src = r.img;
    modalImg.alt = r.title;
    modalMeta.textContent = `Time: ${r.time} • Serves: ${r.serves || '2-4'}`;
    modalIngredients.innerHTML = '';
    r.ingredients.forEach(i=>{const li=document.createElement('li');li.textContent=i;modalIngredients.appendChild(li)});
    modalSteps.innerHTML = '';
    r.steps.forEach(s=>{const li=document.createElement('li');li.textContent=s;modalSteps.appendChild(li)});
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(){
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  document.addEventListener('click', function(e){
    const openBtn = e.target.closest('.open-recipe');
    if(openBtn){
      const id = openBtn.closest('.recipe-card').dataset.id;
      openModal(id);
    }
  });

  if(modalClose) modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', function(e){ if(e.target===modal) closeModal(); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeModal(); });

  // Contact form handling (no backend) — simple client feedback
  const form = document.getElementById('contact-form');
  if(form){
    form.addEventListener('submit', function(ev){
      ev.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();
      const feedback = document.getElementById('contact-feedback');
      if(!name||!email||!message){ feedback.textContent='Please complete all fields.'; feedback.className='feedback-message red'; return; }
      feedback.textContent = 'Thanks — your message has been received!'; feedback.className='feedback-message green';
      form.reset();
    });
  }

})();
// script.js - Mobile menu toggle and form handling (safe guards)
(function() {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('nav-active');
        });
    }

    // Optional contact form handling (only on pages with a form)
    const form = document.querySelector('form');
    if (!form) return;

    const feedbackMessage = document.createElement('p');
    feedbackMessage.classList.add('feedback-message');

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const name = (document.querySelector('#name') || {}).value || '';
        const email = (document.querySelector('#email') || {}).value || '';
        const message = (document.querySelector('#message') || {}).value || '';

        if (!name.trim() || !email.trim() || !message.trim()) {
            feedbackMessage.textContent = 'Please fill in all fields.';
            feedbackMessage.classList.remove('green');
            feedbackMessage.classList.add('red');
            if (!form.contains(feedbackMessage)) form.appendChild(feedbackMessage);
            return;
        }

        feedbackMessage.textContent = "Thank you for your message! We'll get back to you soon.";
        feedbackMessage.classList.remove('red');
        feedbackMessage.classList.add('green');
        form.reset();
        if (!form.contains(feedbackMessage)) form.appendChild(feedbackMessage);
    });
})();
