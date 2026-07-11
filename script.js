
const STORAGE_KEY = 'wealthos-v0.6-data';

const defaults = {
  profile: { name: 'Kurt', currency: 'USD' },
  consulting: { current: 9240, previous: 7277, record: 8800 },
  taxes: { dueDate: '2026-07-21', estimate: 2480, reserved: 2480 },
  emergency: { balance: 24300, essentials: 4050, targetMonths: 6 },
  nextStep: { title: 'Increase your Roth IRA contribution', amount: 500, deadline: '2026-07-31' }
};

function cloneDefaults() {
  return JSON.parse(JSON.stringify(defaults));
}

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || cloneDefaults();
  } catch {
    return cloneDefaults();
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function currencyFormatter(code) {
  return new Intl.NumberFormat(code === 'PHP' ? 'en-PH' : 'en-US', {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 0
  });
}

function formatDate(dateString) {
  if (!dateString) return 'No deadline set';
  const date = new Date(dateString + 'T12:00:00');
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function daysUntil(dateString) {
  if (!dateString) return null;
  const now = new Date();
  now.setHours(0,0,0,0);
  const target = new Date(dateString + 'T00:00:00');
  return Math.ceil((target - now) / 86400000);
}

function updateGreeting(name) {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greeting').textContent = `${part}, ${name}.`;
  document.getElementById('todayDate').textContent = new Intl.DateTimeFormat('en-US', {
    weekday:'long', month:'long', day:'numeric'
  }).format(new Date());
}

function render(data) {
  const money = currencyFormatter(data.profile.currency);
  updateGreeting(data.profile.name);

  const current = Number(data.consulting.current) || 0;
  const previous = Number(data.consulting.previous) || 0;
  const record = Number(data.consulting.record) || 0;
  const delta = current - previous;
  const pct = previous > 0 ? (delta / previous) * 100 : 0;
  const isRecord = current > record;

  document.getElementById('growthTitle').textContent = isRecord
    ? 'Consulting income reached a new monthly high'
    : 'Consulting income changed this month';
  document.getElementById('growthValue').textContent = money.format(current);
  document.getElementById('growthChange').textContent =
    `${delta >= 0 ? '+' : ''}${pct.toFixed(0)}% vs last month`;
  document.getElementById('growthPersonal').textContent = isRecord
    ? `This is your strongest consulting month since you started WealthOS.`
    : `Your consulting income is ${delta >= 0 ? 'above' : 'below'} last month by ${money.format(Math.abs(delta))}.`;
  document.getElementById('growthStoryChanged').textContent =
    `Your consulting income ${delta >= 0 ? 'increased' : 'decreased'} by ${money.format(Math.abs(delta))} compared with last month.`;
  document.getElementById('growthStoryMatters').textContent =
    isRecord ? 'You have moved beyond your previous monthly record.' : 'This gives you a clearer view of the direction of your second income stream.';
  document.getElementById('growthStoryNext').textContent =
    delta >= 0 ? 'Decide how much of this month’s increase should be saved, invested, or reserved for taxes.' : 'Review the change without reacting too quickly to a single month.';

  const dueDays = daysUntil(data.taxes.dueDate);
  const estimate = Number(data.taxes.estimate) || 0;
  const reserved = Number(data.taxes.reserved) || 0;
  const shortfall = Math.max(0, estimate - reserved);
  const fullyFunded = reserved >= estimate;

  document.getElementById('attentionTitle').textContent =
    dueDays !== null && dueDays < 0 ? 'Your quarterly tax payment is past due' : 'Your quarterly tax payment is due soon';
  document.getElementById('attentionValue').textContent =
    dueDays === null ? 'No date' : dueDays < 0 ? `${Math.abs(dueDays)} days late` : `${dueDays} days`;
  document.getElementById('attentionChange').textContent =
    `${money.format(reserved)} currently reserved`;
  document.getElementById('attentionPersonal').textContent = fullyFunded
    ? 'You have already set aside the full estimated amount.'
    : `You still need ${money.format(shortfall)} to fully fund this payment.`;
  document.getElementById('attentionStoryChanged').textContent =
    `Your current estimate is ${money.format(estimate)} and your due date is ${formatDate(data.taxes.dueDate)}.`;
  document.getElementById('attentionStoryMatters').textContent = fullyFunded
    ? 'The payment should not interrupt your normal cash flow.'
    : 'Closing the reserve gap would reduce the chance of using general cash for taxes.';
  document.getElementById('attentionStoryNext').textContent = fullyFunded
    ? 'Schedule the payment and leave the reserve untouched until it clears.'
    : `Move ${money.format(shortfall)} into your tax reserve before the due date.`;

  const balance = Number(data.emergency.balance) || 0;
  const essentials = Math.max(1, Number(data.emergency.essentials) || 1);
  const targetMonths = Math.max(1, Number(data.emergency.targetMonths) || 1);
  const monthsCovered = balance / essentials;
  const targetAmount = essentials * targetMonths;
  const complete = balance >= targetAmount;
  const remaining = Math.max(0, targetAmount - balance);

  document.getElementById('progressTitle').textContent = complete
    ? 'Your emergency fund is complete'
    : 'Your emergency fund is still building';
  document.getElementById('progressValue').textContent = money.format(balance);
  document.getElementById('progressChange').textContent =
    `${monthsCovered.toFixed(1)} months of expenses covered`;
  document.getElementById('progressPersonal').textContent = complete
    ? `You have reached your ${targetMonths}-month target.`
    : `You are ${money.format(remaining)} away from your ${targetMonths}-month target.`;
  document.getElementById('progressStoryChanged').textContent =
    `Your current balance covers approximately ${monthsCovered.toFixed(1)} months of essential expenses.`;
  document.getElementById('progressStoryMatters').textContent = complete
    ? 'Your financial safety net has reached the level you chose for yourself.'
    : 'Each contribution increases the amount of time you could comfortably absorb an income disruption.';
  document.getElementById('progressStoryNext').textContent = complete
    ? 'Choose where future emergency-fund contributions should go next.'
    : `Continue contributing until the remaining ${money.format(remaining)} is complete.`;

  const nextAmount = Number(data.nextStep.amount) || 0;
  document.getElementById('nextTitle').textContent = data.nextStep.title || 'Choose your next financial step';
  document.getElementById('nextValue').textContent = money.format(nextAmount);
  document.getElementById('nextChange').textContent = data.nextStep.deadline
    ? `Recommended by ${formatDate(data.nextStep.deadline)}`
    : 'No deadline set';
  document.getElementById('nextPersonal').textContent = complete
    ? 'Your completed emergency fund creates room for this decision.'
    : 'Review this step alongside your remaining emergency-fund target.';
  document.getElementById('nextStoryWhy').textContent = complete
    ? 'Your cash reserve is at or above the target you selected.'
    : 'This step should be balanced with the amount still needed for your emergency fund.';
  document.getElementById('nextStoryChanges').textContent =
    `${money.format(nextAmount)} would move from available cash toward this priority.`;
  document.getElementById('nextStoryMove').textContent =
    data.nextStep.deadline
      ? `Complete or revisit this step before ${formatDate(data.nextStep.deadline)}.`
      : 'Choose a realistic deadline when you are ready.';

  const attentionNeeded = !fullyFunded || (dueDays !== null && dueDays < 0);
  document.getElementById('financialState').textContent =
    delta >= 0 || complete ? 'Your financial life is moving in the right direction.' : 'Your financial life is steady, with room to rebuild momentum.';
  document.getElementById('attentionState').textContent = attentionNeeded
    ? 'There is one thing worth reviewing today.'
    : 'Nothing requires your attention today.';

  populateForm(data);
}

function populateForm(data) {
  document.getElementById('nameInput').value = data.profile.name;
  document.getElementById('currencyInput').value = data.profile.currency;
  document.getElementById('consultingCurrent').value = data.consulting.current;
  document.getElementById('consultingPrevious').value = data.consulting.previous;
  document.getElementById('consultingRecord').value = data.consulting.record;
  document.getElementById('taxDueDate').value = data.taxes.dueDate;
  document.getElementById('taxEstimate').value = data.taxes.estimate;
  document.getElementById('taxReserved').value = data.taxes.reserved;
  document.getElementById('emergencyBalance').value = data.emergency.balance;
  document.getElementById('essentialExpenses').value = data.emergency.essentials;
  document.getElementById('targetMonths').value = data.emergency.targetMonths;
  document.getElementById('nextActionTitle').value = data.nextStep.title;
  document.getElementById('nextActionAmount').value = data.nextStep.amount;
  document.getElementById('nextActionDeadline').value = data.nextStep.deadline;
}

function readForm() {
  return {
    profile: {
      name: document.getElementById('nameInput').value.trim() || 'You',
      currency: document.getElementById('currencyInput').value
    },
    consulting: {
      current: Number(document.getElementById('consultingCurrent').value) || 0,
      previous: Number(document.getElementById('consultingPrevious').value) || 0,
      record: Number(document.getElementById('consultingRecord').value) || 0
    },
    taxes: {
      dueDate: document.getElementById('taxDueDate').value,
      estimate: Number(document.getElementById('taxEstimate').value) || 0,
      reserved: Number(document.getElementById('taxReserved').value) || 0
    },
    emergency: {
      balance: Number(document.getElementById('emergencyBalance').value) || 0,
      essentials: Number(document.getElementById('essentialExpenses').value) || 1,
      targetMonths: Number(document.getElementById('targetMonths').value) || 1
    },
    nextStep: {
      title: document.getElementById('nextActionTitle').value.trim(),
      amount: Number(document.getElementById('nextActionAmount').value) || 0,
      deadline: document.getElementById('nextActionDeadline').value
    }
  };
}

const panel = document.getElementById('settingsPanel');
const backdrop = document.getElementById('settingsBackdrop');

function openSettings() {
  panel.classList.add('open');
  panel.setAttribute('aria-hidden','false');
  backdrop.hidden = false;
}

function closeSettings() {
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden','true');
  backdrop.hidden = true;
}

document.getElementById('settingsTrigger').addEventListener('click', openSettings);
document.getElementById('closeSettings').addEventListener('click', closeSettings);
backdrop.addEventListener('click', closeSettings);

document.getElementById('settingsForm').addEventListener('submit', event => {
  event.preventDefault();
  const data = readForm();
  saveData(data);
  render(data);
  closeSettings();
});

document.getElementById('resetButton').addEventListener('click', () => {
  const data = cloneDefaults();
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
