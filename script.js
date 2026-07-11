
document.querySelectorAll('.summary').forEach(button=>{
  button.addEventListener('click',()=>{
    const card=button.closest('.signal');
    const open=card.classList.contains('open');
    document.querySelectorAll('.signal.open').forEach(other=>{
      if(other!==card){other.classList.remove('open');other.querySelector('.summary').setAttribute('aria-expanded','false')}
    });
    card.classList.toggle('open',!open);
    button.setAttribute('aria-expanded',String(!open));
  });
});
