const STORAGE_KEY = 'wealthos-v0.7-data';

const currencies = [
  'AED','AFN','ALL','AMD','ANG','AOA','ARS','AUD','AWG','AZN','BAM','BBD','BDT','BGN','BHD','BIF','BMD','BND','BOB','BRL','BSD','BTN','BWP','BYN','BZD',
  'CAD','CDF','CHF','CLP','CNY','COP','CRC','CUP','CVE','CZK','DJF','DKK','DOP','DZD','EGP','ERN','ETB','EUR','FJD','FKP','GBP','GEL','GHS','GIP','GMD','GNF','GTQ','GYD',
  'HKD','HNL','HRK','HTG','HUF','IDR','ILS','INR','IQD','IRR','ISK','JMD','JOD','JPY','KES','KGS','KHR','KMF','KPW','KRW','KWD','KYD','KZT','LAK','LBP','LKR','LRD','LSL','LYD',
  'MAD','MDL','MGA','MKD','MMK','MNT','MOP','MRU','MUR','MVR','MWK','MXN','MYR','MZN','NAD','NGN','NIO','NOK','NPR','NZD','OMR','PAB','PEN','PGK','PHP','PKR','PLN','PYG',
  'QAR','RON','RSD','RUB','RWF','SAR','SBD','SCR','SDG','SEK','SGD','SHP','SLE','SOS','SRD','SSP','STN','SYP','SZL','THB','TJS','TMT','TND','TOP','TRY','TTD','TWD','TZS',
  'UAH','UGX','USD','UYU','UZS','VES','VND','VUV','WST','XAF','XCD','XOF','XPF','YER','ZAR','ZMW','ZWL'
];

const defaults = {
  profile: { name: 'Kurt', currency: 'USD' },
  income: { source: 'Total income', current: 9240, previous: 7277 },
  taxes: { dueDate: '2026-07-21', estimate: 2480, reserved: 2480 },
  emergency: { balance: 24300, essentials: 4050, targetMonths: 6, monthlyContribution: 500 },
  challenge: {
    enabled: true,
    name: 'Philippines trip',
    target: 1200,
    saved: 600,
    startDate: '2026-06-01',
    durationWeeks: 12,
    frequency: 'weekly'
  }
};

function cloneDefaults(){ return JSON.parse(JSON.stringify(defaults)); }
function loadData(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || cloneDefaults(); } catch { return cloneDefaults(); } }
function saveData(data){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

function moneyFormatter(code){
  try {
    return new Intl.NumberFormat(undefined, { style:'currency', currency:code, maximumFractionDigits:0 });
  } catch {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits:0 });
  }
}

function formatDate(dateString){
  if(!dateString) return 'No date set';
  const d = new Date(dateString + 'T12:00:00');
  return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(d);
}

function daysUntil(dateString){
  if(!dateString) return null;
  const now = new Date(); now.setHours(0,0,0,0);
  const target = new Date(dateString + 'T00:00:00');
  return Math.ceil((target-now)/86400000);
}

function updateGreeting(name){
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greeting').textContent = `${part}, ${name}.`;
  document.getElementById('todayDate').textContent = new Intl.DateTimeFormat(undefined,{weekday:'long',month:'long',day:'numeric'}).format(new Date());
}

function contributionPeriods(durationWeeks, frequency){
  if(frequency === 'weekly') return Math.max(1, durationWeeks);
  if(frequency === 'biweekly') return Math.max(1, Math.ceil(durationWeeks / 2));
  return Math.max(1, Math.ceil(durationWeeks / 4.345));
}

function challengeElapsedWeeks(startDate){
  if(!startDate) return 0;
  const start = new Date(startDate + 'T00:00:00');
  const now = new Date(); now.setHours(0,0,0,0);
  return Math.max(0, Math.floor((now-start)/604800000));
}

function buildNextStep(data, calc, money){
  if(calc.taxOverdue){
    return {
      title:'Review your overdue tax payment',
      value:`${Math.abs(calc.taxDays)} days`,
      change:'Past the selected due date',
      personal:'This deserves your attention before any optional allocation.',
      why:`The due date passed on ${formatDate(data.taxes.dueDate)}.`,
      changes:'Resolving it would remove the most time-sensitive obligation in your current financial picture.',
      move:'Confirm whether the payment was made or schedule it today.'
    };
  }

  if(calc.taxShortfall > 0 && calc.taxDays !== null && calc.taxDays <= 30){
    return {
      title:'Complete your tax reserve',
      value:money.format(calc.taxShortfall),
      change:`Due in ${Math.max(0,calc.taxDays)} days`,
      personal:'This is the clearest financial priority based on your current settings.',
      why:`Your estimated payment is ${money.format(calc.taxEstimate)}, but you have reserved ${money.format(calc.taxReserved)}.`,
      changes:'Closing the gap would prevent the payment from drawing on general cash.',
      move:`Move ${money.format(calc.taxShortfall)} into your tax reserve before ${formatDate(data.taxes.dueDate)}.`
    };
  }

  if(!calc.emergencyComplete){
    const contribution = Math.min(calc.emergencyRemaining, Math.max(0, Number(data.emergency.monthlyContribution)||0));
    const amount = contribution > 0 ? contribution : calc.emergencyRemaining;
    return {
      title:'Continue building your emergency fund',
      value:money.format(amount),
      change:`${calc.monthsCovered.toFixed(1)} of ${calc.targetMonths} months covered`,
      personal:'Your emergency fund remains the strongest next foundation to complete.',
      why:`You are ${money.format(calc.emergencyRemaining)} away from your selected target.`,
      changes:`A ${money.format(amount)} contribution would move you closer without changing the target itself.`,
      move:`Set aside ${money.format(amount)} during your next contribution cycle.`
    };
  }

  if(data.challenge.enabled && calc.challengeRemaining > 0){
    return {
      title:`Continue your ${data.challenge.name} challenge`,
      value:money.format(calc.challengeContribution),
      change:`${calc.challengePercent}% complete`,
      personal:'Your safety net is complete, so this goal can take the next available contribution.',
      why:`You have ${money.format(calc.challengeRemaining)} remaining across approximately ${calc.challengePeriodsRemaining} contribution periods.`,
      changes:`Staying at ${money.format(calc.challengeContribution)} per ${data.challenge.frequency === 'monthly' ? 'month' : data.challenge.frequency === 'biweekly' ? 'two weeks' : 'week'} keeps the challenge aligned with its duration.`,
      move:`Make the next ${money.format(calc.challengeContribution)} contribution toward ${data.challenge.name}.`
    };
  }

  return {
    title:'No financial action is required today',
    value:'On track',
    change:'Review again when something changes',
    personal:'Your selected obligations and goals are currently funded or complete.',
    why:'Your tax reserve is funded, your emergency fund is complete, and no active Savings Challenge needs a contribution.',
    changes:'Maintaining the current position protects the progress you have already made.',
    move:'Return when new income, expenses, deadlines, or goals are available.'
  };
}

function render(data){
  const money = moneyFormatter(data.profile.currency);
  updateGreeting(data.profile.name);

  const current = Number(data.income.current)||0;
  const previous = Number(data.income.previous)||0;
  const delta = current-previous;
  const pct = previous > 0 ? (delta/previous)*100 : 0;
  const source = (data.income.source || 'Income').trim();

  document.getElementById('growthTitle').textContent =
    delta > 0 ? `${source} increased this month` : delta < 0 ? `${source} decreased this month` : `${source} held steady this month`;
  document.getElementById('growthValue').textContent = money.format(current);
  document.getElementById('growthChange').textContent =
    previous > 0 ? `${delta>=0?'+':''}${pct.toFixed(0)}% vs last month` : 'No previous-month comparison';
  document.getElementById('growthPersonal').textContent =
    delta > 0 ? `Your ${source.toLowerCase()} is ${money.format(delta)} higher than last month.`
    : delta < 0 ? `Your ${source.toLowerCase()} is ${money.format(Math.abs(delta))} lower than last month.`
    : `Your ${source.toLowerCase()} is unchanged from last month.`;
  document.getElementById('growthStoryChanged').textContent =
    previous > 0 ? `Your ${source.toLowerCase()} moved from ${money.format(previous)} to ${money.format(current)}.`
    : `You have entered ${money.format(current)} for the current month.`;
  document.getElementById('growthStoryMatters').textContent =
    delta > 0 ? 'This gives you more room to fund obligations and chosen goals.'
    : delta < 0 ? 'One month does not define the trend, but it is worth understanding what changed.'
    : 'Stability can be valuable when your obligations and goals remain funded.';
  document.getElementById('growthStoryNext').textContent =
    delta > 0 ? 'Choose how much of the increase should support taxes, savings, or your active challenge.'
    : 'Review the next month before drawing a broader conclusion.';

  const taxDays = daysUntil(data.taxes.dueDate);
  const taxEstimate = Number(data.taxes.estimate)||0;
  const taxReserved = Number(data.taxes.reserved)||0;
  const taxShortfall = Math.max(0,taxEstimate-taxReserved);
  const taxFunded = taxReserved >= taxEstimate;
  const taxOverdue = taxDays !== null && taxDays < 0;

  document.getElementById('attentionTitle').textContent =
    taxOverdue ? 'Your quarterly tax payment may be overdue'
    : taxFunded ? 'Your quarterly tax payment is fully reserved'
    : 'Your quarterly tax reserve needs attention';
  document.getElementById('attentionValue').textContent =
    taxDays === null ? 'No date' : taxOverdue ? `${Math.abs(taxDays)} days late` : `${taxDays} days`;
  document.getElementById('attentionChange').textContent =
    taxFunded ? `${money.format(taxReserved)} reserved` : `${money.format(taxShortfall)} still needed`;
  document.getElementById('attentionPersonal').textContent =
    taxOverdue ? 'Review whether this payment has already been completed.'
    : taxFunded ? 'You have set aside the full estimated amount.'
    : 'Your reserve is not yet fully funded.';
  document.getElementById('attentionStoryChanged').textContent =
    `Your estimated payment is ${money.format(taxEstimate)} and the selected due date is ${formatDate(data.taxes.dueDate)}.`;
  document.getElementById('attentionStoryMatters').textContent =
    taxFunded ? 'The payment should not interrupt your normal cash flow.'
    : 'Closing the gap would reduce the chance of using general cash for taxes.';
  document.getElementById('attentionStoryNext').textContent =
    taxOverdue ? 'Confirm the payment status today.'
    : taxFunded ? 'Keep the reserve untouched until the payment clears.'
    : `Add ${money.format(taxShortfall)} before the due date.`;

  const emergencyBalance = Number(data.emergency.balance)||0;
  const essentials = Math.max(1,Number(data.emergency.essentials)||1);
  const targetMonths = Math.max(1,Number(data.emergency.targetMonths)||1);
  const targetAmount = essentials*targetMonths;
  const monthsCovered = emergencyBalance/essentials;
  const emergencyRemaining = Math.max(0,targetAmount-emergencyBalance);
  const emergencyComplete = emergencyBalance >= targetAmount;

  const challengeTarget = Number(data.challenge.target)||0;
  const challengeSaved = Number(data.challenge.saved)||0;
  const challengeRemaining = Math.max(0,challengeTarget-challengeSaved);
  const challengePercent = challengeTarget > 0 ? Math.min(100,Math.round((challengeSaved/challengeTarget)*100)) : 0;
  const totalPeriods = contributionPeriods(Number(data.challenge.durationWeeks)||1,data.challenge.frequency);
  const elapsedWeeks = challengeElapsedWeeks(data.challenge.startDate);
  const elapsedPeriods = data.challenge.frequency === 'weekly' ? elapsedWeeks : data.challenge.frequency === 'biweekly' ? Math.floor(elapsedWeeks/2) : Math.floor(elapsedWeeks/4.345);
  const challengePeriodsRemaining = Math.max(1,totalPeriods-elapsedPeriods);
  const challengeContribution = challengeRemaining > 0 ? challengeRemaining/challengePeriodsRemaining : 0;

  if(data.challenge.enabled && challengeTarget > 0){
    document.getElementById('progressTitle').textContent = challengeRemaining <= 0
      ? `Your ${data.challenge.name} challenge is complete`
      : `Your ${data.challenge.name} challenge is moving forward`;
    document.getElementById('progressValue').textContent = money.format(challengeSaved);
    document.getElementById('progressChange').textContent = `${challengePercent}% of ${money.format(challengeTarget)} saved`;
    document.getElementById('progressPersonal').textContent = challengeRemaining <= 0
      ? 'You have reached the full target you set for yourself.'
      : `You have ${money.format(challengeRemaining)} remaining.`;
    document.getElementById('progressStoryChanged').textContent =
      `You have saved ${money.format(challengeSaved)} toward ${data.challenge.name}.`;
    document.getElementById('progressStoryMatters').textContent =
      challengeRemaining <= 0 ? 'The goal is complete and ready for its intended purpose.'
      : `Your current pace calls for roughly ${money.format(challengeContribution)} per ${data.challenge.frequency === 'monthly' ? 'month' : data.challenge.frequency === 'biweekly' ? 'two weeks' : 'week'}.`;
    document.getElementById('progressStoryNext').textContent =
      challengeRemaining <= 0 ? 'Decide whether to close the challenge or begin a new one.'
      : `Make the next ${money.format(challengeContribution)} contribution.`;
  } else {
    document.getElementById('progressTitle').textContent = emergencyComplete
      ? 'Your emergency fund is complete'
      : 'Your emergency fund is still building';
    document.getElementById('progressValue').textContent = money.format(emergencyBalance);
    document.getElementById('progressChange').textContent = `${monthsCovered.toFixed(1)} months of expenses covered`;
    document.getElementById('progressPersonal').textContent = emergencyComplete
      ? `You have reached your ${targetMonths}-month target.`
      : `You are ${money.format(emergencyRemaining)} away from your target.`;
    document.getElementById('progressStoryChanged').textContent =
      `Your current balance covers approximately ${monthsCovered.toFixed(1)} months of essential expenses.`;
    document.getElementById('progressStoryMatters').textContent =
      emergencyComplete ? 'Your financial safety net has reached the level you selected.'
      : 'Each contribution increases the amount of time you could absorb an income disruption.';
    document.getElementById('progressStoryNext').textContent =
      emergencyComplete ? 'Choose where future contributions should go next.'
      : `Continue until the remaining ${money.format(emergencyRemaining)} is complete.`;
  }

  const calc = {
    taxDays, taxEstimate, taxReserved, taxShortfall, taxFunded, taxOverdue,
    emergencyBalance, targetMonths, targetAmount, monthsCovered, emergencyRemaining, emergencyComplete,
    challengeRemaining, challengePercent, challengeContribution, challengePeriodsRemaining
  };

  const step = buildNextStep(data,calc,money);
  document.getElementById('nextTitle').textContent = step.title;
  document.getElementById('nextValue').textContent = step.value;
  document.getElementById('nextChange').textContent = step.change;
  document.getElementById('nextPersonal').textContent = step.personal;
  document.getElementById('nextStoryWhy').textContent = step.why;
  document.getElementById('nextStoryChanges').textContent = step.changes;
  document.getElementById('nextStoryMove').textContent = step.move;

  const attentionNeeded = taxOverdue || taxShortfall > 0 || !emergencyComplete;
  document.getElementById('financialState').textContent =
    delta >= 0 || emergencyComplete ? 'Your financial life is moving in the right direction.'
    : 'Your financial life is steady, with room to rebuild momentum.';
  document.getElementById('attentionState').textContent =
    attentionNeeded ? 'There is one thing worth reviewing today.' : 'Nothing requires your attention today.';

  populateForm(data);
}

function populateCurrencyOptions(selected){
  const select = document.getElementById('currencyInput');
  select.innerHTML = '';
  currencies.forEach(code=>{
    const option = document.createElement('option');
    option.value = code;
    let label = code;
    try {
      const name = new Intl.DisplayNames([navigator.language || 'en'],{type:'currency'}).of(code);
      label = `${code} — ${name}`;
    } catch {}
    option.textContent = label;
    if(code===selected) option.selected = true;
    select.appendChild(option);
  });
}

function populateForm(data){
  populateCurrencyOptions(data.profile.currency);
  document.getElementById('nameInput').value=data.profile.name;
  document.getElementById('incomeSourceName').value=data.income.source;
  document.getElementById('incomeCurrent').value=data.income.current;
  document.getElementById('incomePrevious').value=data.income.previous;
  document.getElementById('taxDueDate').value=data.taxes.dueDate;
  document.getElementById('taxEstimate').value=data.taxes.estimate;
  document.getElementById('taxReserved').value=data.taxes.reserved;
  document.getElementById('emergencyBalance').value=data.emergency.balance;
  document.getElementById('essentialExpenses').value=data.emergency.essentials;
  document.getElementById('targetMonths').value=data.emergency.targetMonths;
  document.getElementById('emergencyContribution').value=data.emergency.monthlyContribution;
  document.getElementById('challengeEnabled').checked=data.challenge.enabled;
  document.getElementById('challengeName').value=data.challenge.name;
  document.getElementById('challengeTarget').value=data.challenge.target;
  document.getElementById('challengeSaved').value=data.challenge.saved;
  document.getElementById('challengeStart').value=data.challenge.startDate;
  document.getElementById('challengeDuration').value=String(data.challenge.durationWeeks);
  document.getElementById('challengeFrequency').value=data.challenge.frequency;
  toggleChallengeFields();
}

function readForm(){
  return {
    profile:{
      name:document.getElementById('nameInput').value.trim()||'You',
      currency:document.getElementById('currencyInput').value
    },
    income:{
      source:document.getElementById('incomeSourceName').value.trim()||'Income',
      current:Number(document.getElementById('incomeCurrent').value)||0,
      previous:Number(document.getElementById('incomePrevious').value)||0
    },
    taxes:{
      dueDate:document.getElementById('taxDueDate').value,
      estimate:Number(document.getElementById('taxEstimate').value)||0,
      reserved:Number(document.getElementById('taxReserved').value)||0
    },
    emergency:{
      balance:Number(document.getElementById('emergencyBalance').value)||0,
      essentials:Number(document.getElementById('essentialExpenses').value)||1,
      targetMonths:Number(document.getElementById('targetMonths').value)||1,
      monthlyContribution:Number(document.getElementById('emergencyContribution').value)||0
    },
    challenge:{
      enabled:document.getElementById('challengeEnabled').checked,
      name:document.getElementById('challengeName').value.trim()||'Savings',
      target:Number(document.getElementById('challengeTarget').value)||0,
      saved:Number(document.getElementById('challengeSaved').value)||0,
      startDate:document.getElementById('challengeStart').value,
      durationWeeks:Number(document.getElementById('challengeDuration').value)||12,
      frequency:document.getElementById('challengeFrequency').value
    }
  };
}

function toggleChallengeFields(){
  const enabled = document.getElementById('challengeEnabled').checked;
  const fields = document.getElementById('challengeFields');
  fields.style.opacity = enabled ? '1' : '.45';
  fields.querySelectorAll('input,select').forEach(el=>el.disabled=!enabled);
}

const panel=document.getElementById('settingsPanel');
const backdrop=document.getElementById('settingsBackdrop');
function openSettings(){panel.classList.add('open');panel.setAttribute('aria-hidden','false');backdrop.hidden=false}
function closeSettings(){panel.classList.remove('open');panel.setAttribute('aria-hidden','true');backdrop.hidden=true}

document.getElementById('settingsTrigger').addEventListener('click',openSettings);
document.getElementById('closeSettings').addEventListener('click',closeSettings);
backdrop.addEventListener('click',closeSettings);
document.getElementById('challengeEnabled').addEventListener('change',toggleChallengeFields);

document.getElementById('settingsForm').addEventListener('submit',event=>{
  event.preventDefault();
  const data=readForm();
  saveData(data);
  render(data);
  closeSettings();
});

document.getElementById('resetButton').addEventListener('click',()=>{
  const data=cloneDefaults();
  saveData(data);
  render(data);
});

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

render(loadData());
