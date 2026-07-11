
document.querySelectorAll('.signal-button').forEach(button=>{
  button.addEventListener('click',()=>{
    const card=button.closest('.signal-card');
    const open=card.classList.contains('open');

    document.querySelectorAll('.signal-card.open').forEach(other=>{
      if(other!==card){
        other.classList.remove('open');
        other.querySelector('.signal-button').setAttribute('aria-expanded','false');
      }
    });

    card.classList.toggle('open',!open);
    button.setAttribute('aria-expanded',String(!open));
  });
});
