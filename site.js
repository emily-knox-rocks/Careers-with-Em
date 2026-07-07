/* Careers with Em, shared interactions. Timing and easing match usemotion.com tokens. */
(function(){
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Sticky nav: shadow after ~10px of scroll */
  var nav = document.querySelector('nav');
  function onScroll(){
    if(!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 10);
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* 2. Hero word-cycler (no layout shift: container width is fixed to the widest word) */
  var cycler = document.querySelector('.cycler');
  if(cycler){
    var words;
    try{ words = JSON.parse(cycler.getAttribute('data-words')) || []; }catch(e){ words = []; }
    if(words.length > 1 && !reduced){
      var span = document.createElement('span');
      span.className = 'word';
      span.textContent = words[0];
      cycler.textContent = '';
      cycler.appendChild(span);
      var sizeToWidest = function(){
        var probe = document.createElement('span');
        probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;';
        probe.className = 'word';
        cycler.appendChild(probe);
        var max = 0;
        words.forEach(function(w){
          probe.textContent = w;
          max = Math.max(max, probe.offsetWidth);
        });
        cycler.removeChild(probe);
        cycler.style.minWidth = max + 'px';
      };
      if(document.fonts && document.fonts.ready){ document.fonts.ready.then(sizeToWidest); }
      else { sizeToWidest(); }
      var i = 0;
      setInterval(function(){
        span.classList.add('out');
        setTimeout(function(){
          i = (i + 1) % words.length;
          span.textContent = words[i];
          span.classList.remove('out');
          span.classList.add('in');
          requestAnimationFrame(function(){
            requestAnimationFrame(function(){ span.classList.remove('in'); });
          });
        }, 300);
      }, 2600);
    }
  }

  /* 3. Trust marquee: duplicate the track once for a seamless loop */
  document.querySelectorAll('.trust .marquee').forEach(function(m){
    var track = m.querySelector('.track');
    if(!track) return;
    Array.prototype.slice.call(track.children).forEach(function(item){
      var clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden','true');
      track.appendChild(clone);
    });
  });

  /* 4. Scroll-triggered reveals: fade-up on entry, staggered children, once only */
  var revealTargets = document.querySelectorAll('[data-reveal]');
  revealTargets.forEach(function(container){
    var children = container.hasAttribute('data-reveal-children')
      ? Array.prototype.slice.call(container.children)
      : [container];
    children.forEach(function(el, idx){
      el.classList.add('reveal');
      el.style.setProperty('--reveal-delay', (idx * 80) + 'ms');
    });
  });
  if(!reduced && 'IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          var els = entry.target.hasAttribute('data-reveal-children')
            ? Array.prototype.slice.call(entry.target.children)
            : [entry.target];
          els.forEach(function(el){ el.classList.add('revealed'); });
          io.unobserve(entry.target);
        }
      });
    }, {threshold:.12, rootMargin:'0px 0px -8% 0px'});
    revealTargets.forEach(function(t){ io.observe(t); });
  } else {
    document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('revealed'); });
  }

  /* 5. Accordion FAQ: smooth height transitions on details/summary */
  document.querySelectorAll('.faq details').forEach(function(d){
    var summary = d.querySelector('summary');
    var body = document.createElement('div');
    body.className = 'faq-body';
    Array.prototype.slice.call(d.children).forEach(function(child){
      if(child !== summary) body.appendChild(child);
    });
    d.appendChild(body);
    if(reduced) return;
    summary.addEventListener('click', function(e){
      e.preventDefault();
      if(d.hasAttribute('data-animating')) return;
      d.setAttribute('data-animating','');
      if(d.open){
        var h = body.offsetHeight;
        body.style.height = h + 'px';
        requestAnimationFrame(function(){
          body.style.transition = 'height .25s cubic-bezier(.4,0,.2,1)';
          body.style.height = '0px';
        });
        setTimeout(function(){
          d.open = false;
          body.style.cssText = '';
          d.removeAttribute('data-animating');
        }, 260);
      } else {
        d.open = true;
        var target = body.offsetHeight;
        body.style.height = '0px';
        requestAnimationFrame(function(){
          body.style.transition = 'height .25s cubic-bezier(.4,0,.2,1)';
          body.style.height = target + 'px';
        });
        setTimeout(function(){
          body.style.cssText = '';
          d.removeAttribute('data-animating');
        }, 260);
      }
    });
  });
})();
