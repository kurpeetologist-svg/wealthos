
'use strict';

const STORAGE_KEY = 'wealthos-v0.8-data';
const LEGACY_KEYS = ['wealthos-v0.7-data', 'wealthos-v0.6-data'];

const $ = (id) => {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`WealthOS could not find the required element: #${id}`);
  }
  return element;
};

const ui = {
  greeting: $('greeting'),
  reflection: $('reflection'),
  financialState: $('financialState'),
  attentionState: $('attentionState'),
  todayDate: $('todayDate'),

  growthTitle: $('growthTitle'),
  growthValue: $('growthValue'),
  growthChange: $('growthChange'),
  growthPersonal: $('growthPersonal'),
  growthStoryChanged: $('growthStoryChanged'),
  growthStoryMatters: $('growthStoryMatters'),
  growthStoryNext: $('growthStoryNext'),

  attentionTitle: $('attentionTitle'),
  attentionValue: $('attentionValue'),
  attentionChange: $('attentionChange'),
  attentionPersonal: $('attentionPersonal'),
  attentionStoryChanged: $('attentionStoryChanged'),
  attentionStoryMatters: $('attentionStoryMatters'),
  attentionStoryNext: $('attentionStoryNext'),

  progressTitle: $('progressTitle'),
  progressValue: $('progressValue'),
  progressChange: $('progressChange'),
  progressPersonal: $('progressPersonal'),
  progressStoryChanged: $('progressStoryChanged'),
  progressStoryMatters: $('progressStoryMatters'),
  progressStoryNext: $('progressStoryNext'),

  nextTitle: $('nextTitle'),
  nextValue: $('nextValue'),
  nextChange: $('nextChange'),
  nextPersonal: $('nextPersonal'),
  nextStoryWhy: $('nextStoryWhy'),
  nextStoryChanges: $('nextStoryChanges'),
  nextStoryMove: $('nextStoryMove'),

  timelineSummary: $('timelineSummary'),
  timelineGroups: $('timelineGroups'),
  historyManagerList: $('historyManagerList'),

  aboutTrigger: $('aboutTrigger'),
  panelBackdrop: $('panelBackdrop'),
  aboutPanel: $('aboutPanel'),
  closePanelButton: $('closePanel'),
  aboutForm: $('aboutForm'),
  resetButton: $('resetButton'),

  nameInput: $('nameInput'),
  currencyInput: $('currencyInput'),
  incomeSourceName: $('incomeSourceName'),
  incomeMonth: $('incomeMonth'),
  incomeCurrent: $('incomeCurrent'),
  taxDueDate: $('taxDueDate'),
  taxEstimate: $('taxEstimate'),
  taxReserved: $('taxReserved'),
  emergencyBalance: $('emergencyBalance'),
  essentialExpenses: $('essentialExpenses'),
  targetMonths: $('targetMonths'),
  emergencyContribution: $('emergencyContribution'),
  challengeEnabled: $('challengeEnabled'),
  challengeFields: $('challengeFields'),
  challengeName: $('challengeName'),
  challengeTarget: $('challengeTarget'),
  challengeSaved: $('challengeSaved'),
  challengeStart: $('challengeStart'),
  challengeDuration: $('challengeDuration'),
  challengeFrequency: $('challengeFrequency')
};

const currencies = [
  'AED','AFN','ALL','AMD','ANG','AOA','ARS','AUD','AWG','AZN','BAM','BBD','BDT','BGN','BHD','BIF','BMD','BND','BOB','BRL','BSD','BTN','BWP','BYN','BZD',
  'CAD','CDF','CHF','CLP','CNY','COP','CRC','CUP','CVE','CZK','DJF','DKK','DOP','DZD','EGP','ERN','ETB','EUR','FJD','FKP','GBP','GEL','GHS','GIP','GMD','GNF','GTQ','GYD',
  'HKD','HNL','HRK','HTG','HUF','IDR','ILS','INR','IQD','IRR','ISK','JMD','JOD','JPY','KES','KGS','KHR','KMF','KPW','KRW','KWD','KYD','KZT','LAK','LBP','LKR','LRD','LSL','LYD',
  'MAD','MDL','MGA','MKD','MMK','MNT','MOP','MRU','MUR','MVR','MWK','MXN','MYR','MZN','NAD','NGN','NIO','NOK','NPR','NZD','OMR','PAB','PEN','PGK','PHP','PKR','PLN','PYG',
  'QAR','RON','RSD','RUB','RWF','SAR','SBD','SCR','SDG','SEK','SGD','SHP','SLE','SOS','SRD','SSP','STN','SYP','SZL','THB','TJS','TMT','TND','TOP','TRY','TTD','TWD','TZS',
  'UAH','UGX','USD','UYU','UZS','VES','VND','VUV','WST','XAF','XCD','XOF','XPF','YER','ZAR','ZMW','ZWL'
];

const nowMonth = new Date().toISOString().slice(0, 7);

const defaults = {
  profile: { name: 'Kurt', currency: 'USD' },
  income: { source: 'Total income', currentMonth: nowMonth, current: 9240 },
  incomeHistory: [
    { month: '2026-04', amount: 6800 },
    { month: '2026-05', amount: 7100 },
    { month: '2026-06', amount: 7277 }
  ],
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

const cloneDefaults = () => JSON.parse(JSON.stringify(defaults));

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeData(raw) {
  const fallback = cloneDefaults();
  if (!raw || typeof raw !== 'object') return fallback;

  const migratedIncome = raw.income || raw.consulting || {};
  const currentMonth = migratedIncome.currentMonth || nowMonth;
  const currentAmount = asNumber(
    migratedIncome.current ?? migratedIncome.currentMonth,
    fallback.income.current
  );

  let history = Array.isArray(raw.incomeHistory)
    ? raw.incomeHistory
        .filter(item => item && typeof item.month === 'string')
        .map(item => ({ month: item.month, amount: asNumber(item.amount) }))
    : [];

  // Migrate the earlier manual previous-month value into actual history.
  const legacyPrevious = migratedIncome.previous ?? migratedIncome.previousMonth;
  if (history.length === 0 && legacyPrevious !== undefined) {
    const currentDate = new Date(`${currentMonth}-01T00:00:00`);
    currentDate.setMonth(currentDate.getMonth() - 1);
    history.push({
      month: currentDate.toISOString().slice(0, 7),
      amount: asNumber(legacyPrevious)
    });
  }

  return {
    profile: {
      name: String(raw.profile?.name || fallback.profile.name),
      currency: currencies.includes(raw.profile?.currency)
        ? raw.profile.currency
        : fallback.profile.currency
    },
    income: {
      source: String(migratedIncome.source || migratedIncome.sourceName || fallback.income.source),
      currentMonth,
      current: currentAmount
    },
    incomeHistory: history,
    taxes: {
      dueDate: String(raw.taxes?.dueDate || fallback.taxes.dueDate),
      estimate: asNumber(raw.taxes?.estimate ?? raw.taxes?.estimatedPayment, fallback.taxes.estimate),
      reserved: asNumber(raw.taxes?.reserved ?? raw.taxes?.reservedAmount, fallback.taxes.reserved)
    },
    emergency: {
      balance: asNumber(raw.emergency?.balance ?? raw.emergencyFund?.balance, fallback.emergency.balance),
      essentials: Math.max(1, asNumber(raw.emergency?.essentials ?? raw.emergencyFund?.monthlyEssentialExpenses, fallback.emergency.essentials)),
      targetMonths: Math.max(1, asNumber(raw.emergency?.targetMonths ?? raw.emergencyFund?.targetMonths, fallback.emergency.targetMonths)),
      monthlyContribution: Math.max(0, asNumber(raw.emergency?.monthlyContribution, fallback.emergency.monthlyContribution))
    },
    challenge: {
      enabled: Boolean(raw.challenge?.enabled ?? fallback.challenge.enabled),
      name: String(raw.challenge?.name || fallback.challenge.name),
      target: Math.max(0, asNumber(raw.challenge?.target, fallback.challenge.target)),
      saved: Math.max(0, asNumber(raw.challenge?.saved, fallback.challenge.saved)),
      startDate: String(raw.challenge?.startDate || fallback.challenge.startDate),
      durationWeeks: Math.max(1, asNumber(raw.challenge?.durationWeeks, fallback.challenge.durationWeeks)),
      frequency: ['weekly', 'biweekly', 'monthly'].includes(raw.challenge?.frequency)
        ? raw.challenge.frequency
        : fallback.challenge.frequency
    }
  };
}

function loadData() {
  const keys = [STORAGE_KEY, ...LEGACY_KEYS];

  for (const key of keys) {
    try {
      const value = localStorage.getItem(key);
      if (!value) continue;
      const normalized = normalizeData(JSON.parse(value));
      if (key !== STORAGE_KEY) saveData(normalized);
      return normalized;
    } catch (error) {
      console.warn(`Could not read ${key}; trying the next saved version.`, error);
    }
  }

  return cloneDefaults();
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeData(data)));
}

function moneyFormatter(code) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0
    });
  } catch {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
  }
}

function formatMonth(month) {
  if (!month) return 'Unknown month';
  const [year, monthNumber] = month.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric'
  }).format(new Date(year, monthNumber - 1, 1));
}

function formatDate(dateString) {
  if (!dateString) return 'No date set';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(`${dateString}T12:00:00`));
}

function daysUntil(dateString) {
  if (!dateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateString}T00:00:00`);
  return Math.ceil((target - today) / 86400000);
}

function sortedHistory(data) {
  const byMonth = new Map();

  for (const item of data.incomeHistory || []) {
    if (item.month) byMonth.set(item.month, asNumber(item.amount));
  }

  byMonth.set(data.income.currentMonth, asNumber(data.income.current));

  return [...byMonth.entries()]
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function trendStats(history) {
  const current = history.at(-1) || { amount: 0 };
  const previous = history.at(-2) || null;
  const prior = history.slice(0, -1);
  const priorHigh = prior.length
    ? Math.max(...prior.map(item => asNumber(item.amount)))
    : null;

  let streak = 1;
  for (let index = history.length - 1; index > 0; index -= 1) {
    if (asNumber(history[index].amount) > asNumber(history[index - 1].amount)) {
      streak += 1;
    } else {
      break;
    }
  }

  const average = history.length
    ? history.reduce((sum, item) => sum + asNumber(item.amount), 0) / history.length
    : 0;

  return {
    current,
    previous,
    priorHigh,
    isRecord: priorHigh !== null && asNumber(current.amount) > priorHigh,
    streak,
    average
  };
}

function updateGreeting(name) {
  const hour = new Date().getHours();
  const daypart = hour < 12
    ? 'Good morning'
    : hour < 18
      ? 'Good afternoon'
      : 'Good evening';

  ui.greeting.textContent = `${daypart}, ${name}.`;
  ui.todayDate.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(new Date());
}

function contributionPeriods(durationWeeks, frequency) {
  if (frequency === 'weekly') return Math.max(1, durationWeeks);
  if (frequency === 'biweekly') return Math.max(1, Math.ceil(durationWeeks / 2));
  return Math.max(1, Math.ceil(durationWeeks / 4.345));
}

function challengeElapsedWeeks(startDate) {
  if (!startDate) return 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.max(
    0,
    Math.floor((now - new Date(`${startDate}T00:00:00`)) / 604800000)
  );
}

function buildNextStep(data, calculations, money) {
  if (calculations.taxOverdue) {
    return {
      title: 'Review your overdue tax payment',
      value: `${Math.abs(calculations.taxDays)} days`,
      change: 'Past the selected due date',
      personal: 'This deserves your attention before any optional allocation.',
      why: `The due date passed on ${formatDate(data.taxes.dueDate)}.`,
      changes: 'Resolving it removes the most time-sensitive obligation in your current financial picture.',
      move: 'Confirm whether the payment was made or schedule it today.'
    };
  }

  if (
    calculations.taxShortfall > 0 &&
    calculations.taxDays !== null &&
    calculations.taxDays <= 30
  ) {
    return {
      title: 'Complete your tax reserve',
      value: money.format(calculations.taxShortfall),
      change: `Due in ${Math.max(0, calculations.taxDays)} days`,
      personal: 'This is the clearest financial priority based on your current information.',
      why: `Your estimate is ${money.format(calculations.taxEstimate)}, but you have reserved ${money.format(calculations.taxReserved)}.`,
      changes: 'Closing the gap prevents the payment from drawing on general cash.',
      move: `Move ${money.format(calculations.taxShortfall)} into your tax reserve before ${formatDate(data.taxes.dueDate)}.`
    };
  }

  if (!calculations.emergencyComplete) {
    const planned = Math.max(0, asNumber(data.emergency.monthlyContribution));
    const amount = Math.min(calculations.emergencyRemaining, planned) || calculations.emergencyRemaining;

    return {
      title: 'Continue building your emergency fund',
      value: money.format(amount),
      change: `${calculations.monthsCovered.toFixed(1)} of ${calculations.targetMonths} months covered`,
      personal: 'Your emergency fund remains the strongest next foundation to complete.',
      why: `You are ${money.format(calculations.emergencyRemaining)} away from your selected target.`,
      changes: `A ${money.format(amount)} contribution moves you closer without changing the goal.`,
      move: `Set aside ${money.format(amount)} during your next contribution cycle.`
    };
  }

  if (data.challenge.enabled && calculations.challengeRemaining > 0) {
    const interval = data.challenge.frequency === 'monthly'
      ? 'month'
      : data.challenge.frequency === 'biweekly'
        ? 'two weeks'
        : 'week';

    return {
      title: `Continue your ${data.challenge.name} challenge`,
      value: money.format(calculations.challengeContribution),
      change: `${calculations.challengePercent}% complete`,
      personal: 'Your safety net is complete, so this goal can take the next available contribution.',
      why: `You have ${money.format(calculations.challengeRemaining)} remaining across approximately ${calculations.challengePeriodsRemaining} contribution periods.`,
      changes: `Staying at ${money.format(calculations.challengeContribution)} per ${interval} keeps the challenge aligned with its duration.`,
      move: `Make the next ${money.format(calculations.challengeContribution)} contribution toward ${data.challenge.name}.`
    };
  }

  return {
    title: 'No financial action is required today',
    value: 'On track',
    change: 'Review again when something changes',
    personal: 'Your selected obligations and goals are currently funded or complete.',
    why: 'Your tax reserve is funded, your emergency fund is complete, and no active Savings Challenge needs a contribution.',
    changes: 'Maintaining the current position protects the progress you have already made.',
    move: 'Return when new income, deadlines, or goals are available.'
  };
}

function render(data) {
  const normalized = normalizeData(data);
  const money = moneyFormatter(normalized.profile.currency);
  updateGreeting(normalized.profile.name);

  const history = sortedHistory(normalized);
  const stats = trendStats(history);
  const current = asNumber(stats.current.amount);
  const previous = stats.previous ? asNumber(stats.previous.amount) : null;
  const delta = previous === null ? null : current - previous;
  const percent = previous > 0 ? (delta / previous) * 100 : null;
  const source = normalized.income.source || 'Income';
  const sourceLower = source.toLowerCase();

  ui.growthValue.textContent = money.format(current);

  if (stats.isRecord) {
    ui.growthTitle.textContent = `${source} reached a new monthly high`;
    ui.growthPersonal.textContent = `This is your strongest ${sourceLower} month since you started WealthOS.`;
  } else {
    ui.growthTitle.textContent = delta > 0
      ? `${source} increased this month`
      : delta < 0
        ? `${source} decreased this month`
        : `${source} held steady this month`;

    ui.growthPersonal.textContent = delta === null
      ? 'This is the first month in your WealthOS history.'
      : `Your ${sourceLower} is ${money.format(Math.abs(delta))} ${delta >= 0 ? 'higher' : 'lower'} than last month.`;
  }

  ui.growthChange.textContent = percent === null
    ? 'Your first recorded month'
    : `${delta >= 0 ? '+' : ''}${percent.toFixed(0)}% vs last month`;

  ui.growthStoryChanged.textContent = stats.previous
    ? `Your ${sourceLower} moved from ${money.format(previous)} in ${formatMonth(stats.previous.month)} to ${money.format(current)} in ${formatMonth(stats.current.month)}.`
    : `You recorded ${money.format(current)} for ${formatMonth(stats.current.month)}.`;

  ui.growthStoryMatters.textContent = stats.streak >= 3
    ? `Your ${sourceLower} has grown for ${stats.streak} consecutive months.`
    : stats.isRecord
      ? 'You moved beyond every earlier month stored in WealthOS.'
      : `Your recorded monthly average is ${money.format(stats.average)}.`;

  ui.growthStoryNext.textContent = delta !== null && delta > 0
    ? 'Choose how much of this increase should support taxes, savings, or your active challenge.'
    : 'Keep recording each month so WealthOS can distinguish a pattern from a one-month change.';

  ui.reflection.textContent = stats.streak >= 3
    ? 'Consistency is becoming a pattern.'
    : stats.isRecord
      ? 'A new record deserves a quiet moment.'
      : 'Quiet months build strong years.';

  const taxDays = daysUntil(normalized.taxes.dueDate);
  const taxEstimate = asNumber(normalized.taxes.estimate);
  const taxReserved = asNumber(normalized.taxes.reserved);
  const taxShortfall = Math.max(0, taxEstimate - taxReserved);
  const taxFunded = taxReserved >= taxEstimate;
  const taxOverdue = taxDays !== null && taxDays < 0;

  ui.attentionTitle.textContent = taxOverdue
    ? 'Your quarterly tax payment may be overdue'
    : taxFunded
      ? 'Your quarterly tax payment is fully reserved'
      : 'Your quarterly tax reserve needs attention';

  ui.attentionValue.textContent = taxDays === null
    ? 'No date'
    : taxOverdue
      ? `${Math.abs(taxDays)} days late`
      : `${taxDays} days`;

  ui.attentionChange.textContent = taxFunded
    ? `${money.format(taxReserved)} reserved`
    : `${money.format(taxShortfall)} still needed`;

  ui.attentionPersonal.textContent = taxOverdue
    ? 'Review whether this payment has already been completed.'
    : taxFunded
      ? 'You have set aside the full estimated amount.'
      : 'Your reserve is not yet fully funded.';

  ui.attentionStoryChanged.textContent = `Your estimated payment is ${money.format(taxEstimate)} and the selected due date is ${formatDate(normalized.taxes.dueDate)}.`;
  ui.attentionStoryMatters.textContent = taxFunded
    ? 'The payment should not interrupt your normal cash flow.'
    : 'Closing the gap reduces the chance of using general cash for taxes.';
  ui.attentionStoryNext.textContent = taxOverdue
    ? 'Confirm the payment status today.'
    : taxFunded
      ? 'Keep the reserve untouched until the payment clears.'
      : `Add ${money.format(taxShortfall)} before the due date.`;

  const emergencyBalance = asNumber(normalized.emergency.balance);
  const essentials = Math.max(1, asNumber(normalized.emergency.essentials, 1));
  const targetMonths = Math.max(1, asNumber(normalized.emergency.targetMonths, 1));
  const targetAmount = essentials * targetMonths;
  const monthsCovered = emergencyBalance / essentials;
  const emergencyRemaining = Math.max(0, targetAmount - emergencyBalance);
  const emergencyComplete = emergencyBalance >= targetAmount;

  const challengeTarget = asNumber(normalized.challenge.target);
  const challengeSaved = asNumber(normalized.challenge.saved);
  const challengeRemaining = Math.max(0, challengeTarget - challengeSaved);
  const challengePercent = challengeTarget > 0
    ? Math.min(100, Math.round((challengeSaved / challengeTarget) * 100))
    : 0;

  const totalPeriods = contributionPeriods(
    asNumber(normalized.challenge.durationWeeks, 1),
    normalized.challenge.frequency
  );
  const elapsedWeeks = challengeElapsedWeeks(normalized.challenge.startDate);
  const elapsedPeriods = normalized.challenge.frequency === 'weekly'
    ? elapsedWeeks
    : normalized.challenge.frequency === 'biweekly'
      ? Math.floor(elapsedWeeks / 2)
      : Math.floor(elapsedWeeks / 4.345);

  const challengePeriodsRemaining = Math.max(1, totalPeriods - elapsedPeriods);
  const challengeContribution = challengeRemaining > 0
    ? challengeRemaining / challengePeriodsRemaining
    : 0;

  if (normalized.challenge.enabled && challengeTarget > 0) {
    const interval = normalized.challenge.frequency === 'monthly'
      ? 'month'
      : normalized.challenge.frequency === 'biweekly'
        ? 'two weeks'
        : 'week';

    ui.progressTitle.textContent = challengeRemaining <= 0
      ? `Your ${normalized.challenge.name} challenge is complete`
      : `Your ${normalized.challenge.name} challenge is moving forward`;

    ui.progressValue.textContent = money.format(challengeSaved);
    ui.progressChange.textContent = `${challengePercent}% of ${money.format(challengeTarget)} saved`;
    ui.progressPersonal.textContent = challengeRemaining <= 0
      ? 'You reached the full target you set for yourself.'
      : `You have ${money.format(challengeRemaining)} remaining.`;

    ui.progressStoryChanged.textContent = `You have saved ${money.format(challengeSaved)} toward ${normalized.challenge.name}.`;
    ui.progressStoryMatters.textContent = challengeRemaining <= 0
      ? 'The goal is complete and ready for its intended purpose.'
      : `Your current pace calls for roughly ${money.format(challengeContribution)} per ${interval}.`;
    ui.progressStoryNext.textContent = challengeRemaining <= 0
      ? 'Decide whether to close the challenge or begin a new one.'
      : `Make the next ${money.format(challengeContribution)} contribution.`;
  } else {
    ui.progressTitle.textContent = emergencyComplete
      ? 'Your emergency fund is complete'
      : 'Your emergency fund is still building';

    ui.progressValue.textContent = money.format(emergencyBalance);
    ui.progressChange.textContent = `${monthsCovered.toFixed(1)} months of expenses covered`;
    ui.progressPersonal.textContent = emergencyComplete
      ? `You reached your ${targetMonths}-month target.`
      : `You are ${money.format(emergencyRemaining)} away from your target.`;

    ui.progressStoryChanged.textContent = `Your current balance covers approximately ${monthsCovered.toFixed(1)} months of essential expenses.`;
    ui.progressStoryMatters.textContent = emergencyComplete
      ? 'Your financial safety net has reached the level you selected.'
      : 'Each contribution increases the time you could absorb an income disruption.';
    ui.progressStoryNext.textContent = emergencyComplete
      ? 'Choose where future contributions should go next.'
      : `Continue until the remaining ${money.format(emergencyRemaining)} is complete.`;
  }

  const step = buildNextStep(normalized, {
    taxDays,
    taxEstimate,
    taxReserved,
    taxShortfall,
    taxFunded,
    taxOverdue,
    monthsCovered,
    targetMonths,
    emergencyRemaining,
    emergencyComplete,
    challengeRemaining,
    challengePercent,
    challengeContribution,
    challengePeriodsRemaining
  }, money);

  ui.nextTitle.textContent = step.title;
  ui.nextValue.textContent = step.value;
  ui.nextChange.textContent = step.change;
  ui.nextPersonal.textContent = step.personal;
  ui.nextStoryWhy.textContent = step.why;
  ui.nextStoryChanges.textContent = step.changes;
  ui.nextStoryMove.textContent = step.move;

  const attentionNeeded = taxOverdue || taxShortfall > 0 || !emergencyComplete;
  ui.financialState.textContent = delta === null || delta >= 0 || emergencyComplete
    ? 'Your financial life is moving in the right direction.'
    : 'Your financial life is steady, with room to rebuild momentum.';
  ui.attentionState.textContent = attentionNeeded
    ? 'There is one thing worth reviewing today.'
    : 'Nothing requires your attention today.';

  renderTimeline(normalized, history, stats, money, source);
  populateForm(normalized);
}



function createTimelineEvent({
  title,
  description,
  amount = '',
  tone = 'neutral',
  happened = '',
  matters = '',
  trajectory = '',
  momentum = ''
}) {
  const event = document.createElement('article');
  event.className = 'timeline-event';
  event.dataset.tone = tone;

  const button = document.createElement('button');
  button.className = 'timeline-event-button';
  button.type = 'button';
  button.setAttribute('aria-expanded', 'false');

  const marker = document.createElement('span');
  marker.className = 'timeline-marker';
  marker.setAttribute('aria-hidden', 'true');

  const copy = document.createElement('div');
  copy.className = 'timeline-copy';

  const heading = document.createElement('h4');
  heading.textContent = title;

  const paragraph = document.createElement('p');
  paragraph.textContent = description;

  const toneLabel = document.createElement('span');
  toneLabel.className = 'story-tone';
  toneLabel.textContent = tone === 'growth'
    ? 'Momentum'
    : tone === 'attention'
      ? 'Worth reviewing'
      : tone === 'progress'
        ? 'Progress'
        : 'Reflection';

  copy.append(heading, paragraph, toneLabel);

  const action = document.createElement('span');
  action.className = 'timeline-event-action';
  action.innerHTML = '<span>Read story</span><b>+</b>';

  button.append(marker, copy);

  if (amount) {
    const value = document.createElement('div');
    value.className = 'timeline-amount';
    value.textContent = amount;
    button.appendChild(value);
  } else {
    button.appendChild(action);
  }

  if (amount) {
    action.style.gridColumn = '3';
    action.style.marginTop = '42px';
    button.appendChild(action);
  }

  const story = document.createElement('div');
  story.className = 'timeline-story';

  const inner = document.createElement('div');
  inner.className = 'timeline-story-inner';

  const sections = [
    ['What happened', happened || description],
    ['Why it matters', matters || 'This moment adds context to the broader direction of your financial life.'],
    ['Your trajectory', trajectory || 'WealthOS will keep comparing future months against this point in your Timeline.'],
    ['Continue the momentum', momentum || 'Keep your information current so the next chapter reflects what actually changed.']
  ];

  sections.forEach(([label, text]) => {
    const block = document.createElement('div');
    block.className = 'timeline-story-block';

    const sectionLabel = document.createElement('span');
    sectionLabel.textContent = label;

    const sectionText = document.createElement('p');
    sectionText.textContent = text;

    block.append(sectionLabel, sectionText);
    inner.appendChild(block);
  });

  story.appendChild(inner);
  event.append(button, story);

  button.addEventListener('click', () => {
    const wasOpen = event.classList.contains('open');

    document.querySelectorAll('.timeline-event.open').forEach(openEvent => {
      if (openEvent !== event) {
        openEvent.classList.remove('open');
        openEvent
          .querySelector('.timeline-event-button')
          .setAttribute('aria-expanded', 'false');
      }
    });

    event.classList.toggle('open', !wasOpen);
    button.setAttribute('aria-expanded', String(!wasOpen));
  });

  return event;
}


function incomeMoments(history, stats, money, source) {
  const groups = new Map();

  history.forEach((item, index) => {
    const previous = index > 0 ? history[index - 1] : null;
    const amount = asNumber(item.amount);
    const previousAmount = previous ? asNumber(previous.amount) : null;
    const difference = previousAmount === null ? null : amount - previousAmount;
    const priorAmounts = history
      .slice(0, index)
      .map(entry => asNumber(entry.amount));
    const isRecord = priorAmounts.length > 0 && amount > Math.max(...priorAmounts);

    let moment;

    if (index === 0) {
      moment = {
        title: 'Your WealthOS income story began',
        description: `You recorded ${money.format(amount)} in ${source.toLowerCase()}.`,
        amount: money.format(amount),
        tone: 'neutral',
        happened: `You saved your first ${source.toLowerCase()} entry for ${formatMonth(item.month)}.`,
        matters: 'This became the baseline WealthOS will use to understand future movement.',
        trajectory: 'There is not enough history yet to define a pattern, and that is completely normal.',
        momentum: 'Return next month and record the next figure so your Timeline can begin showing direction.'
      };
    } else if (isRecord) {
      moment = {
        title: `${source} reached a new monthly high`,
        description: `You moved beyond every earlier ${source.toLowerCase()} month saved in WealthOS.`,
        amount: money.format(amount),
        tone: 'growth',
        happened: `Your ${source.toLowerCase()} reached ${money.format(amount)}, exceeding the prior saved high.`,
        matters: 'This is not simply a higher number. It marks a new reference point for your future progress.',
        trajectory: difference > 0
          ? `You improved by ${money.format(difference)} from the prior month and established a stronger baseline.`
          : 'This month now becomes the level future months will be measured against.',
        momentum: 'Decide how much of the increase should support taxes, savings, or another priority before it blends into normal spending.'
      };
    } else if (difference > 0) {
      moment = {
        title: `${source} moved forward`,
        description: `Your ${source.toLowerCase()} increased by ${money.format(difference)} from the prior month.`,
        amount: money.format(amount),
        tone: 'growth',
        happened: `Your ${source.toLowerCase()} rose from ${money.format(previousAmount)} to ${money.format(amount)}.`,
        matters: 'A single increase does not guarantee a trend, but it creates more room for obligations and chosen goals.',
        trajectory: stats.streak >= 3
          ? `This became part of a ${stats.streak}-month growth streak.`
          : 'The direction is positive, and another month will show whether it is becoming a pattern.',
        momentum: 'Protect part of the increase before allocating the rest.'
      };
    } else if (difference < 0) {
      moment = {
        title: `${source} softened`,
        description: `Your ${source.toLowerCase()} was ${money.format(Math.abs(difference))} lower than the prior month.`,
        amount: money.format(amount),
        tone: 'attention',
        happened: `Your ${source.toLowerCase()} moved from ${money.format(previousAmount)} to ${money.format(amount)}.`,
        matters: 'A softer month deserves context, not panic. Seasonal changes and timing can affect a single period.',
        trajectory: amount >= stats.average
          ? 'Despite the decline, this month remained at or above your recorded average.'
          : 'This month fell below your recorded average, making the next entry especially useful for context.',
        momentum: 'Review what changed, but wait for another month before treating this as a lasting direction.'
      };
    } else {
      moment = {
        title: `${source} remained steady`,
        description: `Your ${source.toLowerCase()} matched the prior month.`,
        amount: money.format(amount),
        tone: 'neutral',
        happened: `You recorded the same ${source.toLowerCase()} amount for two consecutive months.`,
        matters: 'Stability can be valuable when your obligations and savings goals remain supported.',
        trajectory: 'Your current baseline is holding steady.',
        momentum: 'Keep recording the next month so WealthOS can identify when stability begins to shift.'
      };
    }

    if (!groups.has(item.month)) groups.set(item.month, []);
    groups.get(item.month).push(moment);
  });

  return groups;
}

function addCurrentFinancialMoments(data, groups, money) {
  const currentMonth = data.income.currentMonth || nowMonth;
  if (!groups.has(currentMonth)) groups.set(currentMonth, []);
  const currentEvents = groups.get(currentMonth);

  const taxEstimate = asNumber(data.taxes.estimate);
  const taxReserved = asNumber(data.taxes.reserved);
  const taxShortfall = Math.max(0, taxEstimate - taxReserved);
  const taxDays = daysUntil(data.taxes.dueDate);

  if (taxEstimate > 0) {
    if (taxShortfall === 0) {
      currentEvents.push({
        title: 'Your tax reserve became fully funded',
        description: `You have set aside the full estimated payment due ${formatDate(data.taxes.dueDate)}.`,
        amount: money.format(taxReserved),
        tone: 'progress',
        happened: `Your reserved amount reached the full ${money.format(taxEstimate)} estimate.`,
        matters: 'The payment should not need to draw from your everyday cash.',
        trajectory: 'You are entering the due date with the obligation already accounted for.',
        momentum: 'Keep the reserve untouched until the payment clears.'
      });
    } else {
      currentEvents.push({
        title: 'Your tax reserve still has a gap',
        description: `${money.format(taxShortfall)} remains before the selected due date${taxDays === null ? '.' : `, currently ${Math.abs(taxDays)} day${Math.abs(taxDays) === 1 ? '' : 's'} ${taxDays < 0 ? 'past due' : 'away'}.`}`,
        amount: money.format(taxReserved),
        tone: 'attention',
        happened: `You reserved ${money.format(taxReserved)} against an estimated ${money.format(taxEstimate)} payment.`,
        matters: 'The remaining gap could otherwise come from general cash when the payment is due.',
        trajectory: 'This is the most time-sensitive unfinished obligation in your current Timeline.',
        momentum: `Close the remaining ${money.format(taxShortfall)} gap before ${formatDate(data.taxes.dueDate)}.`
      });
    }
  }

  const emergencyBalance = asNumber(data.emergency.balance);
  const essentials = Math.max(1, asNumber(data.emergency.essentials, 1));
  const targetMonths = Math.max(1, asNumber(data.emergency.targetMonths, 1));
  const targetAmount = essentials * targetMonths;
  const monthsCovered = emergencyBalance / essentials;

  if (emergencyBalance >= targetAmount) {
    currentEvents.push({
      title: 'Your emergency fund reached its target',
      description: `Your safety net now covers approximately ${monthsCovered.toFixed(1)} months of essential expenses.`,
      amount: money.format(emergencyBalance),
      tone: 'progress',
      happened: `Your emergency balance reached ${money.format(emergencyBalance)}.`,
      matters: 'You created a stronger buffer against short-term income disruption or unexpected expenses.',
      trajectory: 'The foundation you selected for yourself is now complete.',
      momentum: 'Choose where future emergency-fund contributions should go next.'
    });
  }

  if (data.challenge.enabled && asNumber(data.challenge.target) > 0) {
    const saved = asNumber(data.challenge.saved);
    const target = asNumber(data.challenge.target);
    const percentage = Math.min(100, Math.round((saved / target) * 100));

    currentEvents.push({
      title: percentage >= 100
        ? `Your ${data.challenge.name} challenge is complete`
        : `Your ${data.challenge.name} challenge reached ${percentage}%`,
      description: percentage >= 100
        ? 'You reached the full target you set for yourself.'
        : `${money.format(Math.max(0, target - saved))} remains before the challenge is complete.`,
      amount: money.format(saved),
      tone: 'progress',
      happened: `You have saved ${money.format(saved)} toward a ${money.format(target)} target.`,
      matters: percentage >= 100
        ? 'The money is now ready for the purpose you chose.'
        : 'The challenge turns a future goal into a visible commitment you can keep moving forward.',
      trajectory: percentage >= 100
        ? 'This chapter is complete.'
        : `You are ${percentage}% of the way there.`,
      momentum: percentage >= 100
        ? 'Close the challenge or define the next goal when you are ready.'
        : `Make the next planned contribution toward ${data.challenge.name}.`
    });
  }
}

function renderTimeline(data, history, stats, money, source) {
  ui.timelineGroups.replaceChildren();

  const groups = incomeMoments(history, stats, money, source);
  addCurrentFinancialMoments(data, groups, money);

  const orderedMonths = [...groups.keys()]
    .sort((a, b) => b.localeCompare(a));

  const totalMoments = [...groups.values()]
    .reduce((sum, events) => sum + events.length, 0);

  ui.timelineSummary.textContent = totalMoments === 0
    ? 'Your first financial moment will appear after you save an entry.'
    : `${totalMoments} financial moment${totalMoments === 1 ? '' : 's'} remembered across ${orderedMonths.length} month${orderedMonths.length === 1 ? '' : 's'}.`;

  if (orderedMonths.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'timeline-empty';

    const heading = document.createElement('h3');
    heading.textContent = 'Your Timeline begins here.';

    const paragraph = document.createElement('p');
    paragraph.textContent = 'Save your first month in About You, and WealthOS will begin remembering the moments behind your numbers.';

    empty.append(heading, paragraph);
    ui.timelineGroups.appendChild(empty);
    return;
  }

  orderedMonths.forEach(month => {
    const monthSection = document.createElement('section');
    monthSection.className = 'timeline-month';

    const monthHeading = document.createElement('div');
    monthHeading.className = 'timeline-month-heading';

    const heading = document.createElement('h3');
    heading.textContent = formatMonth(month);

    const count = document.createElement('p');
    const events = groups.get(month);
    count.textContent = `${events.length} moment${events.length === 1 ? '' : 's'}`;

    monthHeading.append(heading, count);

    const eventList = document.createElement('div');
    eventList.className = 'timeline-events';

    events.forEach(eventData => {
      eventList.appendChild(createTimelineEvent(eventData));
    });

    monthSection.append(monthHeading, eventList);
    ui.timelineGroups.appendChild(monthSection);
  });
}

function populateCurrencyOptions(selected) {
  ui.currencyInput.replaceChildren();

  currencies.forEach(code => {
    const option = document.createElement('option');
    option.value = code;

    let label = code;
    try {
      const displayNames = new Intl.DisplayNames(
        [navigator.language || 'en'],
        { type: 'currency' }
      );
      label = `${code} — ${displayNames.of(code)}`;
    } catch {
      // The ISO code remains the label in older browsers.
    }

    option.textContent = label;
    option.selected = code === selected;
    ui.currencyInput.appendChild(option);
  });
}

function populateForm(data) {
  populateCurrencyOptions(data.profile.currency);
  ui.nameInput.value = data.profile.name;
  ui.incomeSourceName.value = data.income.source;
  ui.incomeMonth.value = data.income.currentMonth || nowMonth;
  ui.incomeCurrent.value = data.income.current;
  ui.taxDueDate.value = data.taxes.dueDate;
  ui.taxEstimate.value = data.taxes.estimate;
  ui.taxReserved.value = data.taxes.reserved;
  ui.emergencyBalance.value = data.emergency.balance;
  ui.essentialExpenses.value = data.emergency.essentials;
  ui.targetMonths.value = data.emergency.targetMonths;
  ui.emergencyContribution.value = data.emergency.monthlyContribution;
  ui.challengeEnabled.checked = data.challenge.enabled;
  ui.challengeName.value = data.challenge.name;
  ui.challengeTarget.value = data.challenge.target;
  ui.challengeSaved.value = data.challenge.saved;
  ui.challengeStart.value = data.challenge.startDate;
  ui.challengeDuration.value = String(data.challenge.durationWeeks);
  ui.challengeFrequency.value = data.challenge.frequency;
  toggleChallengeFields();
  renderHistoryManager(data);
}

function renderHistoryManager(data) {
  ui.historyManagerList.replaceChildren();

  const entries = (data.incomeHistory || [])
    .slice()
    .sort((a, b) => b.month.localeCompare(a.month));

  if (entries.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'form-help';
    empty.textContent = 'No earlier months have been saved yet.';
    ui.historyManagerList.appendChild(empty);
    return;
  }

  const money = moneyFormatter(data.profile.currency);

  entries.forEach(item => {
    const row = document.createElement('div');
    row.className = 'history-manager-row';

    const month = document.createElement('span');
    month.textContent = formatMonth(item.month);

    const amount = document.createElement('strong');
    amount.textContent = money.format(asNumber(item.amount));

    const remove = document.createElement('button');
    remove.className = 'delete-history';
    remove.type = 'button';
    remove.dataset.month = item.month;
    remove.textContent = 'Remove';

    remove.addEventListener('click', () => {
      const latest = loadData();
      latest.incomeHistory = (latest.incomeHistory || [])
        .filter(entry => entry.month !== item.month);
      saveData(latest);
      render(latest);
    });

    row.append(month, amount, remove);
    ui.historyManagerList.appendChild(row);
  });
}

function readForm() {
  const data = loadData();
  const month = ui.incomeMonth.value || nowMonth;
  const amount = asNumber(ui.incomeCurrent.value);

  // Preserve the formerly current month as history when the user advances months.
  if (
    data.income.currentMonth &&
    data.income.currentMonth !== month
  ) {
    const byMonth = new Map(
      (data.incomeHistory || []).map(item => [item.month, asNumber(item.amount)])
    );
    byMonth.set(data.income.currentMonth, asNumber(data.income.current));
    data.incomeHistory = [...byMonth.entries()]
      .map(([entryMonth, entryAmount]) => ({
        month: entryMonth,
        amount: entryAmount
      }));
  }

  data.incomeHistory = (data.incomeHistory || [])
    .filter(item => item.month !== month);

  data.profile = {
    name: ui.nameInput.value.trim() || 'You',
    currency: ui.currencyInput.value
  };
  data.income = {
    source: ui.incomeSourceName.value.trim() || 'Income',
    currentMonth: month,
    current: amount
  };
  data.taxes = {
    dueDate: ui.taxDueDate.value,
    estimate: asNumber(ui.taxEstimate.value),
    reserved: asNumber(ui.taxReserved.value)
  };
  data.emergency = {
    balance: asNumber(ui.emergencyBalance.value),
    essentials: Math.max(1, asNumber(ui.essentialExpenses.value, 1)),
    targetMonths: Math.max(1, asNumber(ui.targetMonths.value, 1)),
    monthlyContribution: Math.max(0, asNumber(ui.emergencyContribution.value))
  };
  data.challenge = {
    enabled: ui.challengeEnabled.checked,
    name: ui.challengeName.value.trim() || 'Savings',
    target: Math.max(0, asNumber(ui.challengeTarget.value)),
    saved: Math.max(0, asNumber(ui.challengeSaved.value)),
    startDate: ui.challengeStart.value,
    durationWeeks: Math.max(1, asNumber(ui.challengeDuration.value, 12)),
    frequency: ui.challengeFrequency.value
  };

  return normalizeData(data);
}

function toggleChallengeFields() {
  const enabled = ui.challengeEnabled.checked;
  ui.challengeFields.style.opacity = enabled ? '1' : '.45';

  ui.challengeFields
    .querySelectorAll('input, select')
    .forEach(element => {
      element.disabled = !enabled;
    });
}

function openAboutPanel() {
  ui.aboutPanel.classList.add('open');
  ui.aboutPanel.setAttribute('aria-hidden', 'false');
  ui.panelBackdrop.hidden = false;
}

function closeAboutPanel() {
  ui.aboutPanel.classList.remove('open');
  ui.aboutPanel.setAttribute('aria-hidden', 'true');
  ui.panelBackdrop.hidden = true;
}

ui.aboutTrigger.addEventListener('click', openAboutPanel);
ui.closePanelButton.addEventListener('click', closeAboutPanel);
ui.panelBackdrop.addEventListener('click', closeAboutPanel);
ui.challengeEnabled.addEventListener('change', toggleChallengeFields);

ui.aboutForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = readForm();
  saveData(data);
  render(data);
  closeAboutPanel();
});

ui.resetButton.addEventListener('click', () => {
  const data = cloneDefaults();
  saveData(data);
  render(data);
});

document.querySelectorAll('.signal-button').forEach(button => {
  button.addEventListener('click', () => {
    const card = button.closest('.signal-card');
    const wasOpen = card.classList.contains('open');

    document.querySelectorAll('.signal-card.open').forEach(openCard => {
      if (openCard !== card) {
        openCard.classList.remove('open');
        openCard
          .querySelector('.signal-button')
          .setAttribute('aria-expanded', 'false');
      }
    });

    card.classList.toggle('open', !wasOpen);
    button.setAttribute('aria-expanded', String(!wasOpen));
  });
});

try {
  render(loadData());
} catch (error) {
  console.error('WealthOS v0.8.4 could not complete its initial render.', error);

  // Keep the failure visible and understandable instead of leaving blank cards.
  ui.growthTitle.textContent = 'WealthOS needs a quick refresh';
  ui.growthValue.textContent = '—';
  ui.growthChange.textContent = 'Open the browser console for details';
  ui.growthPersonal.textContent = 'Your saved information has not been deleted.';
}
