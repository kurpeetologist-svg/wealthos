
'use strict';

const STORAGE_KEY='wealthos-v0.22.0-data';
const LEGACY_KEYS=['wealthos-v0.21.4-data','wealthos-v0.21.3-data','wealthos-v0.21.2-data','wealthos-v0.21.1-data','wealthos-v0.21.0-data','wealthos-v0.20.0-data','wealthos-v0.19.0-data','wealthos-v0.18.0-data','wealthos-v0.17.0-data','wealthos-v0.16.0-data','wealthos-v0.15.1-data','wealthos-v0.15.0-data','wealthos-v0.14.1-data','wealthos-v0.14.0-data','wealthos-v0.13.0-data','wealthos-v0.12.0-data','wealthos-v0.11.0-data','wealthos-v0.10.1-data','wealthos-v0.10.0-data','wealthos-v0.9.4-data','wealthos-v0.9.3-data','wealthos-v0.9.2.1-data','wealthos-v0.9.2-data','wealthos-v0.9.1-data','wealthos-v0.9-data','wealthos-v0.8-data','wealthos-v0.7-data','wealthos-v0.6-data'];
const nowMonth=new Date().toISOString().slice(0,7);
const $=id=>document.getElementById(id);

const currencies=['AED','AFN','ALL','AMD','ANG','AOA','ARS','AUD','AWG','AZN','BAM','BBD','BDT','BGN','BHD','BIF','BMD','BND','BOB','BRL','BSD','BTN','BWP','BYN','BZD','CAD','CDF','CHF','CLP','CNY','COP','CRC','CUP','CVE','CZK','DJF','DKK','DOP','DZD','EGP','ERN','ETB','EUR','FJD','FKP','GBP','GEL','GHS','GIP','GMD','GNF','GTQ','GYD','HKD','HNL','HRK','HTG','HUF','IDR','ILS','INR','IQD','IRR','ISK','JMD','JOD','JPY','KES','KGS','KHR','KMF','KPW','KRW','KWD','KYD','KZT','LAK','LBP','LKR','LRD','LSL','LYD','MAD','MDL','MGA','MKD','MMK','MNT','MOP','MRU','MUR','MVR','MWK','MXN','MYR','MZN','NAD','NGN','NIO','NOK','NPR','NZD','OMR','PAB','PEN','PGK','PHP','PKR','PLN','PYG','QAR','RON','RSD','RUB','RWF','SAR','SBD','SCR','SDG','SEK','SGD','SHP','SLE','SOS','SRD','SSP','STN','SYP','SZL','THB','TJS','TMT','TND','TOP','TRY','TTD','TWD','TZS','UAH','UGX','USD','UYU','UZS','VES','VND','VUV','WST','XAF','XCD','XOF','XPF','YER','ZAR','ZMW','ZWL'];

const blankData=()=>({
  onboardingComplete:false,
  profile:{name:'',currency:'USD'},
  income:{source:'Total income',currentMonth:nowMonth,current:null},
  incomeHistory:[],
  taxes:{dueDate:'',estimate:0,reserved:0},
  emergency:{balance:0,essentials:0,targetMonths:6,monthlyContribution:0},
  challenge:{enabled:false,name:'',target:0,saved:0,startDate:'',durationWeeks:12,frequency:'weekly'},
  roadmaps:[],
  memories:[],
  spending:{daily:0,weekly:0,monthly:0},
  expenses:[],
  incomes:[],
  accounts:[],
  recurringBills:[],
  debts:[],
  debtPayments:[],
  transfers:[],
  auditLog:[],
  schemaVersion:'1.0.0',
  checkins:[],
  memory:{lastInteraction:null,lastCheckinType:null,lastCheckinDate:null,lastSummary:null}
});

function n(v,f=0){const x=Number(v);return Number.isFinite(x)?x:f}

function coreId(prefix='record'){
  if(globalThis.crypto?.randomUUID)return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function manualSource(){
  const stamp=new Date().toISOString();
  return{
    method:'manual',
    reportedBy:'user',
    confidence:'reported',
    verified:false,
    imported:false,
    createdAt:stamp,
    updatedAt:stamp
  };
}

function normalizeSource(source){
  const stamp=new Date().toISOString();
  return{
    method:String(source?.method||'manual'),
    reportedBy:String(source?.reportedBy||'user'),
    confidence:String(source?.confidence||'reported'),
    verified:Boolean(source?.verified),
    imported:Boolean(source?.imported),
    createdAt:String(source?.createdAt||stamp),
    updatedAt:String(source?.updatedAt||source?.createdAt||stamp)
  };
}

function normalizeRecordState(item){
  return{
    status:['active','archived','reversed'].includes(item?.status)?item.status:'active',
    archivedAt:item?.archivedAt?String(item.archivedAt):null,
    reversedAt:item?.reversedAt?String(item.reversedAt):null,
    reversalReason:String(item?.reversalReason||''),
    revision:Math.max(1,n(item?.revision,1))
  };
}

function normalizeRecurrence(item){
  const frequency=['once','weekly','biweekly','monthly','quarterly','annual','custom'].includes(item?.recurrence?.frequency)
    ? item.recurrence.frequency
    : String(item?.frequency||'once');

  return{
    frequency:['once','weekly','biweekly','monthly','quarterly','annual','custom'].includes(frequency)?frequency:'once',
    amountBehavior:['fixed','variable'].includes(item?.recurrence?.amountBehavior)?item.recurrence.amountBehavior:'fixed',
    nextExpectedDate:String(item?.recurrence?.nextExpectedDate||item?.nextDueDate||''),
    endDate:String(item?.recurrence?.endDate||''),
    customInterval:Math.max(1,n(item?.recurrence?.customInterval,1)),
    customUnit:['days','weeks','months','years'].includes(item?.recurrence?.customUnit)?item.recurrence.customUnit:'months',
    active:item?.recurrence?.active!==false&&frequency!=='once',
    createdFromRecordId:item?.recurrence?.createdFromRecordId?String(item.recurrence.createdFromRecordId):null
  };
}

function isRecurring(item){
  const recurrence=normalizeRecurrence(item);
  return recurrence.active&&recurrence.frequency!=='once';
}

function recurrenceLabel(item){
  const recurrence=normalizeRecurrence(item);
  const labels={
    once:'One-time',
    weekly:'Weekly',
    biweekly:'Every two weeks',
    monthly:'Monthly',
    quarterly:'Quarterly',
    annual:'Annually',
    custom:`Every ${recurrence.customInterval} ${recurrence.customUnit}`
  };
  return labels[recurrence.frequency]||'One-time';
}

function addInterval(dateString,recurrence){
  if(!dateString)return '';
  const date=new Date(`${dateString}T12:00:00`);
  if(Number.isNaN(date.getTime()))return '';
  const r=normalizeRecurrence({recurrence});
  if(r.frequency==='weekly')date.setDate(date.getDate()+7);
  if(r.frequency==='biweekly')date.setDate(date.getDate()+14);
  if(r.frequency==='monthly')date.setMonth(date.getMonth()+1);
  if(r.frequency==='quarterly')date.setMonth(date.getMonth()+3);
  if(r.frequency==='annual')date.setFullYear(date.getFullYear()+1);
  if(r.frequency==='custom'){
    if(r.customUnit==='days')date.setDate(date.getDate()+r.customInterval);
    if(r.customUnit==='weeks')date.setDate(date.getDate()+7*r.customInterval);
    if(r.customUnit==='months')date.setMonth(date.getMonth()+r.customInterval);
    if(r.customUnit==='years')date.setFullYear(date.getFullYear()+r.customInterval);
  }
  return localDateKey(date);
}

function recurrenceFromForm(prefix='record'){
  const frequency=$(prefix==='record'?'recordRecurrence':'recurringFrequency').value;
  if(frequency==='once')return normalizeRecurrence({recurrence:{frequency:'once',active:false}});
  return normalizeRecurrence({recurrence:{
    frequency,
    amountBehavior:$(prefix==='record'?'recordAmountBehavior':'recurringAmountBehavior').value,
    nextExpectedDate:$(prefix==='record'?'recordNextExpectedDate':'recurringNextDate').value,
    endDate:$(prefix==='record'?'recordRecurrenceEndDate':'recurringEndDate').value,
    customInterval:n($(prefix==='record'?'recordCustomInterval':'recurringCustomInterval').value,1),
    customUnit:$(prefix==='record'?'recordCustomUnit':'recurringCustomUnit').value,
    active:true
  }});
}


function appendAudit(data,action,entityType,entity,detail=''){
  data.auditLog=Array.isArray(data.auditLog)?data.auditLog:[];
  data.auditLog.push({
    id:coreId('audit'),
    occurredAt:new Date().toISOString(),
    action,
    entityType,
    entityId:String(entity?.id||''),
    sourceMethod:String(entity?.source?.method||'manual'),
    detail:String(detail||'')
  });
  if(data.auditLog.length>1000)data.auditLog=data.auditLog.slice(-1000);
}

function canonicalExpense(item){
  return{
    id:String(item.id||coreId('expense')),
    amount:Math.max(0,n(item.amount)),
    category:String(item.category||'Other'),
    merchant:String(item.merchant||item.name||''),
    note:String(item.note||''),
    date:String(item.date||localDateKey()),
    accountId:item.accountId?String(item.accountId):null,
    essential:['essential','discretionary'].includes(item.essential)?item.essential:'unknown',
    recurringBillId:item.recurringBillId?String(item.recurringBillId):null,
    tags:Array.isArray(item.tags)?item.tags.map(String):[],
    source:normalizeSource(item.source),
    recurrence:normalizeRecurrence(item),
    ...normalizeRecordState(item)
  };
}

function canonicalIncome(item){
  return{
    id:String(item.id||coreId('income')),
    amount:Math.max(0,n(item.amount)),
    category:String(item.category||'Other'),
    sourceName:String(item.sourceName||item.source||'Income'),
    date:String(item.date||`${item.month||nowMonth}-01`),
    month:String(item.month||String(item.date||'').slice(0,7)||nowMonth),
    accountId:item.accountId?String(item.accountId):null,
    note:String(item.note||''),
    source:normalizeSource(item.source),
    recurrence:normalizeRecurrence(item),
    ...normalizeRecordState(item)
  };
}

function currentEntityCount(data){
  return (data.expenses||[]).length+(data.incomes||[]).length+(data.accounts||[]).length+
    (data.recurringBills||[]).length+(data.debts||[]).length+(data.debtPayments||[]).length+
    (data.transfers||[]).length+(data.roadmaps||[]).length;
}

function knowledgeState(data){
  const counts={
    income:(data.incomes||[]).length,
    expenses:(data.expenses||[]).length,
    accounts:(data.accounts||[]).length,
    bills:(data.recurringBills||[]).length,
    debts:(data.debts||[]).length,
    roadmaps:(data.roadmaps||[]).length
  };
  const domains=Object.values(counts).filter(Boolean).length;
  const historyDates=[
    ...(data.incomes||[]).map(x=>x.date),
    ...(data.expenses||[]).map(x=>x.date),
    ...(data.checkins||[]).map(x=>x.date)
  ].filter(Boolean).sort();
  const daySpan=historyDates.length>1
    ? Math.max(0,Math.round((new Date(`${historyDates.at(-1)}T12:00:00`)-new Date(`${historyDates[0]}T12:00:00`))/86400000))
    : 0;

  if(currentEntityCount(data)===0)return{label:'Beginning',text:'WealthOS is still learning the shape of your financial life.',counts,daySpan};
  if(domains<=2||daySpan<7)return{label:'Partial',text:'There is enough information for basic context, but not enough history for strong patterns.',counts,daySpan};
  if(domains<=4||daySpan<30)return{label:'Growing',text:'Your records support useful observations. Longer-term conclusions remain cautious.',counts,daySpan};
  return{label:'Established',text:'WealthOS has a broader foundation, while still distinguishing facts, estimates, and user-reported records.',counts,daySpan};
}

function syncCanonicalIncomeToLegacy(data){
  const byMonth=new Map();
  (data.incomes||[]).forEach(item=>byMonth.set(item.month,(byMonth.get(item.month)||0)+n(item.amount)));
  const months=[...byMonth.keys()].sort();
  if(!months.length)return;
  const latest=months.at(-1);
  data.income.currentMonth=latest;
  data.income.current=byMonth.get(latest);
  const latestRecords=(data.incomes||[]).filter(x=>x.month===latest);
  data.income.source=latestRecords.length===1?latestRecords[0].sourceName:'Recorded income';
  data.incomeHistory=months.slice(0,-1).map(month=>({month,amount:byMonth.get(month)}));
}

function applyAccountDelta(data,accountId,delta){
  if(!accountId)return;
  const account=(data.accounts||[]).find(item=>item.id===accountId);
  if(account)account.balance=n(account.balance)+n(delta);
}

function saveData(d){localStorage.setItem(STORAGE_KEY,JSON.stringify(d))}
function hasMeaningfulData(d){return d?.onboardingComplete||n(d?.income?.current)>0||(d?.incomeHistory||[]).length>0}
function migrate(raw){
  if(!raw||typeof raw!=='object')return blankData();
  const d=blankData();
  d.onboardingComplete=Boolean(raw.onboardingComplete??hasMeaningfulData(raw));
  d.profile.name=String(raw.profile?.name||'');
  d.profile.currency=currencies.includes(raw.profile?.currency)?raw.profile.currency:'USD';
  const inc=raw.income||raw.consulting||{};
  d.income.source=String(inc.source||inc.sourceName||'Total income');
  d.income.currentMonth=inc.currentMonth||nowMonth;
  d.income.current=inc.current!==undefined?n(inc.current):inc.currentMonth!==undefined?n(inc.currentMonth):null;
  d.incomeHistory=Array.isArray(raw.incomeHistory)?raw.incomeHistory.filter(x=>x?.month).map(x=>({month:x.month,amount:n(x.amount)})):[];
  if(!d.incomeHistory.length&&inc.previous!==undefined){
    const prev=new Date(`${d.income.currentMonth}-01T00:00:00`);prev.setMonth(prev.getMonth()-1);
    d.incomeHistory=[{month:prev.toISOString().slice(0,7),amount:n(inc.previous)}];
  }
  d.taxes={dueDate:String(raw.taxes?.dueDate||''),estimate:n(raw.taxes?.estimate),reserved:n(raw.taxes?.reserved)};
  d.emergency={balance:n(raw.emergency?.balance),essentials:n(raw.emergency?.essentials),targetMonths:Math.max(1,n(raw.emergency?.targetMonths,6)),monthlyContribution:n(raw.emergency?.monthlyContribution)};
  d.challenge={enabled:Boolean(raw.challenge?.enabled),name:String(raw.challenge?.name||''),target:n(raw.challenge?.target),saved:n(raw.challenge?.saved),startDate:String(raw.challenge?.startDate||''),durationWeeks:Math.max(1,n(raw.challenge?.durationWeeks,12)),frequency:['weekly','biweekly','monthly'].includes(raw.challenge?.frequency)?raw.challenge.frequency:'weekly'};
  d.roadmaps=Array.isArray(raw.roadmaps)?raw.roadmaps.filter(item=>item&&item.name).map(item=>({
    id:String(item.id||`roadmap-${Date.now()}-${Math.random()}`),
    name:String(item.name||'Roadmap'),
    type:String(item.type||'other'),
    target:Math.max(0,n(item.target)),
    saved:Math.max(0,n(item.saved)),
    startDate:String(item.startDate||''),
    targetDate:String(item.targetDate||''),
    monthlyContribution:Math.max(0,n(item.monthlyContribution)),
    status:String(item.status||'active'),
    ...normalizeRecordState(item)
  })):[];
  if(!d.roadmaps.length&&d.challenge.enabled&&d.challenge.name&&d.challenge.target>0){
    d.roadmaps.push({
      id:'migrated-challenge',
      name:d.challenge.name,
      type:/emergency/i.test(d.challenge.name)?'emergency':/travel|trip|vacation/i.test(d.challenge.name)?'travel':'other',
      target:d.challenge.target,
      saved:d.challenge.saved,
      startDate:d.challenge.startDate,
      targetDate:'',
      monthlyContribution:0,
      status:d.challenge.saved>=d.challenge.target?'complete':'active'
    });
  }
  d.memories=Array.isArray(raw.memories)?raw.memories.filter(item=>item&&item.id).map(item=>({
    id:String(item.id),type:String(item.type||'moment'),date:String(item.date||''),title:String(item.title||''),detail:String(item.detail||''),roadmapId:item.roadmapId?String(item.roadmapId):null
  })):[];

  d.spending={daily:Math.max(0,n(raw.spending?.daily)),weekly:Math.max(0,n(raw.spending?.weekly)),monthly:Math.max(0,n(raw.spending?.monthly))};
  d.expenses=Array.isArray(raw.expenses)?raw.expenses.filter(item=>item&&item.date).map(canonicalExpense):[];
  d.incomes=Array.isArray(raw.incomes)?raw.incomes.map(canonicalIncome):[];
  if(!d.incomes.length){
    const legacyIncome=[];
    (d.incomeHistory||[]).forEach(item=>legacyIncome.push(canonicalIncome({
      id:`legacy-income-${item.month}`,
      amount:item.amount,
      category:'Other',
      sourceName:d.income.source,
      month:item.month,
      date:`${item.month}-01`,
      source:{method:'manual',reportedBy:'user',confidence:'reported',verified:false,imported:false}
    })));
    if(d.income.current!==null&&n(d.income.current)>0){
      legacyIncome.push(canonicalIncome({
        id:`legacy-income-${d.income.currentMonth}`,
        amount:d.income.current,
        category:'Other',
        sourceName:d.income.source,
        month:d.income.currentMonth,
        date:`${d.income.currentMonth}-01`,
        source:{method:'manual',reportedBy:'user',confidence:'reported',verified:false,imported:false}
      }));
    }
    d.incomes=legacyIncome;
  }
  d.accounts=Array.isArray(raw.accounts)?raw.accounts.filter(Boolean).map(item=>({
    id:String(item.id||coreId('account')),
    name:String(item.name||'Account'),
    type:String(item.type||'Other'),
    balance:n(item.balance),
    currency:String(item.currency||d.profile.currency),
    note:String(item.note||''),
    source:normalizeSource(item.source),
    recurrence:normalizeRecurrence(item),
    ...normalizeRecordState(item)
  })):[];
  d.recurringBills=Array.isArray(raw.recurringBills)?raw.recurringBills.filter(Boolean).map(item=>({
    id:String(item.id||coreId('bill')),
    name:String(item.name||'Recurring bill'),
    expectedAmount:Math.max(0,n(item.expectedAmount??item.amount)),
    frequency:String(item.frequency||'monthly'),
    nextDueDate:String(item.nextDueDate||item.dueDate||''),
    accountId:item.accountId?String(item.accountId):null,
    note:String(item.note||''),
    active:item.active!==false,
    source:normalizeSource(item.source),
    recurrence:normalizeRecurrence(item),
    ...normalizeRecordState(item)
  })):[];
  d.debts=Array.isArray(raw.debts)?raw.debts.filter(Boolean).map(item=>({
    id:String(item.id||coreId('debt')),
    name:String(item.name||'Debt'),
    type:String(item.type||'Other'),
    balance:Math.max(0,n(item.balance)),
    apr:item.apr===''||item.apr===null?null:Math.max(0,n(item.apr)),
    minimumPayment:Math.max(0,n(item.minimumPayment)),
    dueDate:String(item.dueDate||''),
    accountId:item.accountId?String(item.accountId):null,
    note:String(item.note||''),
    source:normalizeSource(item.source),
    recurrence:normalizeRecurrence(item),
    ...normalizeRecordState(item)
  })):[];
  d.debtPayments=Array.isArray(raw.debtPayments)?raw.debtPayments.filter(Boolean).map(item=>({
    id:String(item.id||coreId('debt-payment')),
    debtId:String(item.debtId||''),
    amount:Math.max(0,n(item.amount)),
    date:String(item.date||localDateKey()),
    accountId:item.accountId?String(item.accountId):null,
    note:String(item.note||''),
    source:normalizeSource(item.source),
    recurrence:normalizeRecurrence(item),
    ...normalizeRecordState(item)
  })):[];
  d.transfers=Array.isArray(raw.transfers)?raw.transfers.filter(Boolean).map(item=>({
    id:String(item.id||coreId('transfer')),
    fromAccountId:item.fromAccountId?String(item.fromAccountId):null,
    toAccountId:item.toAccountId?String(item.toAccountId):null,
    amount:Math.max(0,n(item.amount)),
    date:String(item.date||localDateKey()),
    note:String(item.note||''),
    source:normalizeSource(item.source),
    recurrence:normalizeRecurrence(item),
    ...normalizeRecordState(item)
  })):[];
  d.auditLog=Array.isArray(raw.auditLog)?raw.auditLog.filter(Boolean).map(item=>({
    id:String(item.id||coreId('audit')),
    occurredAt:String(item.occurredAt||new Date().toISOString()),
    action:String(item.action||'migrated'),
    entityType:String(item.entityType||'unknown'),
    entityId:String(item.entityId||''),
    sourceMethod:String(item.sourceMethod||'manual'),
    detail:String(item.detail||'')
  })):[];
  d.schemaVersion=String(raw.schemaVersion||'1.0.0');
  syncCanonicalIncomeToLegacy(d);
  d.checkins=Array.isArray(raw.checkins)?raw.checkins:[];
  d.memory={
    lastInteraction:raw.memory?.lastInteraction||null,
    lastCheckinType:raw.memory?.lastCheckinType||null,
    lastCheckinDate:raw.memory?.lastCheckinDate||null,
    lastSummary:raw.memory?.lastSummary||null
  };
  return d;
}
function loadData(){
  for(const key of [STORAGE_KEY,...LEGACY_KEYS]){
    try{
      const raw=localStorage.getItem(key);
      if(raw){
        const data=migrate(JSON.parse(raw));
        if(key!==STORAGE_KEY)saveData(data);
        return data;
      }
    }catch(e){console.warn('Skipped unreadable saved data',key,e)}
  }
  return blankData();
}
function money(code){try{return new Intl.NumberFormat(undefined,{style:'currency',currency:code,maximumFractionDigits:0})}catch{return new Intl.NumberFormat(undefined,{maximumFractionDigits:0})}}
function formatMonth(m){if(!m)return'';const [y,mo]=m.split('-').map(Number);return new Intl.DateTimeFormat(undefined,{month:'long',year:'numeric'}).format(new Date(y,mo-1,1))}
function formatDate(s){if(!s)return'No date set';return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(s+'T12:00:00'))}
function daysUntil(s){if(!s)return null;const t=new Date();t.setHours(0,0,0,0);return Math.ceil((new Date(s+'T00:00:00')-t)/86400000)}
function greeting(){
  const now=new Date(),h=now.getHours();
  $('greeting').textContent=(h<12?'Good morning.':h<18?'Good afternoon.':'Good evening.');
  $('reflection').textContent="Let's see where you stand today.";
  const headerDate=$('headerDate');
  if(headerDate)headerDate.textContent=now.toLocaleDateString(undefined,{month:'short',day:'numeric'});
}
function fillCurrency(select,selected){select.innerHTML='';currencies.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;o.selected=c===selected;select.appendChild(o)})}
function sortedHistory(d){
  const map=new Map((d.incomeHistory||[]).map(x=>[x.month,n(x.amount)]));
  if(d.income.current!==null)map.set(d.income.currentMonth,n(d.income.current));
  return [...map.entries()].map(([month,amount])=>({month,amount})).sort((a,b)=>a.month.localeCompare(b.month));
}
function stats(h){
  const cur=h.at(-1)||{amount:0},prev=h.at(-2)||null,prior=h.slice(0,-1),high=prior.length?Math.max(...prior.map(x=>x.amount)):null;
  let streak=1;for(let i=h.length-1;i>0;i--){if(h[i].amount>h[i-1].amount)streak++;else break}
  return{cur,prev,isRecord:high!==null&&cur.amount>high,avg:h.length?h.reduce((s,x)=>s+x.amount,0)/h.length:0,streak}
}
function showState(isReturning){
  $('firstVisitLobby').hidden=isReturning;$('returningLobby').hidden=!isReturning;
  $('firstVisitFocus').hidden=isReturning;$('workspace').hidden=!isReturning;$('financialLedger').hidden=!isReturning;$('savingsEnvelope').hidden=!isReturning;$('signalGrid').hidden=!isReturning;$('continueExploring').hidden=!isReturning;
  $('firstVisitCheckin').hidden=isReturning;$('returningCheckin').hidden=!isReturning;$('connectionChoice').hidden=!isReturning;
  $('firstVisitTimeline').hidden=isReturning;$('timelineGroups').hidden=!isReturning;
  $('firstVisitSnapshot').hidden=isReturning;$('returningSnapshot').hidden=!isReturning;
  $('aboutTrigger').hidden=!isReturning;
  $('focusIntro').textContent=isReturning?'One useful next step, today’s picture, and what WealthOS is beginning to notice.':"We'll surface the four most important things to know after your first check-in.";
}

const lessons=[
  {category:'Foundations',title:'What is cash flow?',summary:'Cash flow is the movement of money into and out of your financial life over a period of time.',why:'Positive cash flow means more money came in than went out. Negative cash flow means spending and obligations exceeded income.',keep:'Cash flow is about timing as well as totals. A person can earn enough overall and still face a shortage if bills arrive before income.'},
  {category:'Saving',title:'What is an emergency fund?',summary:'An emergency fund is money reserved for unexpected essential expenses or a temporary loss of income.',why:'It can reduce the need to use high-interest debt when a necessary expense appears unexpectedly.',keep:'Many people begin with a small milestone, then work toward several months of essential expenses.'},
  {category:'Spending',title:'What is the difference between fixed and variable expenses?',summary:'Fixed expenses tend to remain consistent, while variable expenses change with use or choice.',why:'Knowing the difference helps identify which costs are difficult to change quickly and which can respond more easily to new priorities.',keep:'Rent is often fixed. Dining, fuel, and entertainment are usually variable, although every household is different.'},
  {category:'Income',title:'Gross income and net income are not the same.',summary:'Gross income is earned before deductions. Net income is what remains after taxes, benefits, and other deductions.',why:'Plans based on gross income can overstate how much money is actually available to spend or save.',keep:'For everyday cash-flow decisions, net income is usually the more useful starting point.'},
  {category:'Debt & Credit',title:'Why can minimum credit-card payments keep debt around for years?',summary:'A minimum payment may cover interest and only a small part of the original balance.',why:'When interest continues to accrue, repayment can take much longer and cost substantially more than the amount originally borrowed.',keep:'The statement’s repayment disclosure can show how payment size changes the estimated payoff time.'},
  {category:'Debt & Credit',title:'What is credit utilization?',summary:'Credit utilization compares revolving balances with available revolving credit.',why:'Many credit-scoring models consider how much available credit is being used when a balance is reported.',keep:'It is one factor among many. Payment history and avoiding unaffordable debt remain important.'},
  {category:'Investing',title:'What is compound growth?',summary:'Compound growth occurs when returns can begin generating additional returns over time.',why:'The effect becomes more meaningful over longer periods because growth builds on earlier growth.',keep:'Compounding can magnify losses as well as gains, and investment returns are never guaranteed.'},
  {category:'Investing',title:'What is diversification?',summary:'Diversification means spreading investments across different assets rather than relying on one outcome.',why:'Different investments may respond differently to the same event, which can reduce dependence on a single company, sector, or market.',keep:'Diversification can manage some risk, but it cannot eliminate all investment risk.'},
  {category:'Investing',title:'What is an index fund?',summary:'An index fund is designed to track a defined market index rather than select individual investments one by one.',why:'It can provide broad exposure through a single fund and often uses a rules-based, lower-cost approach.',keep:'Index funds differ in fees, holdings, risk, and the markets they track.'},
  {category:'Taxes',title:'What is tax withholding?',summary:'Tax withholding is money taken from income and sent toward expected tax obligations before the worker receives net pay.',why:'Withholding spreads tax payments across the year instead of requiring the entire amount at filing time.',keep:'The amount withheld may be more or less than the final tax owed, depending on income and personal circumstances.'},
  {category:'Insurance',title:'What is an insurance deductible?',summary:'A deductible is the amount a policyholder generally pays before covered insurance benefits begin paying.',why:'Plans with higher deductibles may have lower premiums, but they require more out-of-pocket money when covered care or damage occurs.',keep:'Deductibles, copays, coinsurance, limits, and exclusions can all affect the actual cost of coverage.'},
  {category:'Economics',title:'How does inflation affect purchasing power?',summary:'Inflation means the general price level rises, so the same amount of money may buy less over time.',why:'A savings or income amount can increase in dollars while still losing purchasing power if prices rise faster.',keep:'Inflation affects categories differently and does not mean every price rises at the same rate.'},
  {category:'Planning',title:'What is a sinking fund?',summary:'A sinking fund is money saved gradually for a known future expense.',why:'Breaking a large predictable cost into smaller contributions can reduce the need for debt or a sudden hit to monthly cash flow.',keep:'Examples include annual insurance, travel, home repairs, gifts, and vehicle registration.'},
  {category:'Benefits',title:'Why do payroll benefits matter?',summary:'Benefits can include health coverage, retirement contributions, insurance, paid leave, and government-mandated programs.',why:'They affect both current net pay and the broader value or protection connected to employment.',keep:'Benefit systems vary by employer and country, so users should review the specific rules that apply to them.'}
]

function renderLesson(){
  const now=new Date();
  const start=new Date(now.getFullYear(),0,0);
  const day=Math.floor((now-start)/86400000);
  const lesson=lessons[day%lessons.length];

  $('lessonCategory').textContent=lesson.category;
  $('lessonTitle').textContent=lesson.title;
  $('lessonSummary').textContent=lesson.summary;
  $('lessonWhy').textContent=lesson.why;
  $('lessonKeepInMind').textContent=lesson.keep;
}


function latestMonthlySaving(data){
  const monthly=[...(data.checkins||[])].filter(item=>item.type==='monthly').sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  return monthly.length?n(monthly[0].saved):0;
}
function renderFinancialLedger(data,fmt){
  const income=n(data.income?.current),spending=n(data.spending?.monthly),saving=latestMonthlySaving(data),remaining=income-spending;
  $('ledgerCurrency').textContent=data.profile.currency;
  $('ledgerIncome').textContent=fmt.format(income);
  $('ledgerSpending').textContent=fmt.format(spending);
  $('ledgerSaving').textContent=fmt.format(saving);
  $('ledgerRemaining').textContent=fmt.format(remaining);
  $('ledgerContext').textContent=income<=0
    ? 'Add monthly income during a Check-in to place spending, saving, and remaining funds in context.'
    : `Recorded spending represents ${(spending/income*100).toFixed(0)}% of monthly income. Recorded saving represents ${(saving/income*100).toFixed(0)}%.`;
}

function assembleFinancialDesk(){
  const body=document.body;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  body.classList.remove('desk-ready','desk-assembling');
  body.classList.add('desk-pending');
  if(reduce){requestAnimationFrame(()=>{body.classList.remove('desk-pending');body.classList.add('desk-ready')});return}
  setTimeout(()=>{body.classList.remove('desk-pending');body.classList.add('desk-assembling')},120);
  setTimeout(()=>{body.classList.remove('desk-assembling');body.classList.add('desk-ready')},800);
}
function renderSavingsEnvelope(data,fmt){
  const hasChallenge=data.challenge.enabled&&n(data.challenge.target)>0;
  const hasEmergency=n(data.emergency?.balance)>0||n(data.emergency?.essentials)>0;
  if(hasChallenge){
    const saved=n(data.challenge.saved),target=n(data.challenge.target);
    $('envelopeTitle').textContent=data.challenge.name||'Savings goal';
    $('envelopeContext').textContent=target>0?`${Math.min(100,Math.round(saved/target*100))}% of your target is currently saved.`:'Add a target to begin.';
    $('envelopeLabel').textContent='Saved';$('envelopeValue').textContent=fmt.format(saved);
  }else if(hasEmergency){
    $('envelopeTitle').textContent='Emergency fund';
    $('envelopeContext').textContent='Money set aside to give you more options when life changes.';
    $('envelopeLabel').textContent='Current balance';$('envelopeValue').textContent=fmt.format(n(data.emergency.balance));
  }else{
    $('envelopeTitle').textContent='Your future fund';
    $('envelopeContext').textContent='Create a Savings Challenge or emergency-fund target when you are ready.';
    $('envelopeLabel').textContent='Saved';$('envelopeValue').textContent=fmt.format(0);
  }
}


function activeRoadmaps(data){
  return (data.roadmaps||[]).filter(item=>recordStatus(item)==='active'&&n(item.target)>0);
}

function primaryRoadmap(data){
  const active=activeRoadmaps(data);
  return active.find(item=>item.status==='active'&&n(item.saved)<n(item.target))||active[0]||null;
}

function syncLegacyChallenge(data){
  const roadmap=primaryRoadmap(data);
  if(!roadmap){
    data.challenge={enabled:false,name:'',target:0,saved:0,startDate:'',durationWeeks:12,frequency:'weekly'};
    return data;
  }
  data.challenge={
    enabled:true,
    name:roadmap.name,
    target:n(roadmap.target),
    saved:n(roadmap.saved),
    startDate:roadmap.startDate||'',
    durationWeeks:12,
    frequency:'monthly'
  };
  return data;
}

function roadmapTypeLabel(type){
  return ({
    emergency:'Emergency Fund',
    travel:'Travel',
    purchase:'Major Purchase',
    debt:'Debt Payoff',
    home:'Home',
    education:'Education',
    investing:'Investing',
    other:'Life Goal'
  })[type]||'Life Goal';
}

function roadmapNextMilestone(roadmap,fmt){
  const target=n(roadmap.target);
  const saved=n(roadmap.saved);
  if(target<=0)return 'Add a target to begin.';
  if(saved>=target)return 'Roadmap complete.';
  const pct=saved/target*100;
  const thresholds=[25,50,75,100];
  const nextPct=thresholds.find(value=>value>pct)||100;
  const nextAmount=target*nextPct/100;
  const remaining=Math.max(0,nextAmount-saved);
  return `${fmt.format(remaining)} to reach ${nextPct}%.`;
}

function estimatedRoadmapTiming(roadmap){
  const remaining=Math.max(0,n(roadmap.target)-n(roadmap.saved));
  const monthly=n(roadmap.monthlyContribution);
  if(remaining<=0)return 'Complete';
  if(monthly>0){
    const months=Math.ceil(remaining/monthly);
    return months===1?'About one month':`About ${months} months`;
  }
  if(roadmap.targetDate){
    const days=daysUntil(roadmap.targetDate);
    if(days!==null&&days>=0)return days<31?`${days} days remaining`:`About ${Math.ceil(days/30.44)} months`;
  }
  return 'Add a contribution pace';
}

function memoryExists(data,id){
  return (data.memories||[]).some(item=>item.id===id);
}

function addMemory(data,memory){
  if(memoryExists(data,memory.id))return false;
  data.memories.push(memory);
  return true;
}

function updateFinancialMemories(data){
  data.memories=Array.isArray(data.memories)?data.memories:[];
  let changed=false;
  const fmt=money(data.profile.currency);
  const expenses=[...activeOnly(data.expenses)].sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const checkins=[...(data.checkins||[])].sort((a,b)=>String(a.date).localeCompare(String(b.date)));

  if(expenses.length){
    const first=expenses[0];
    changed=addMemory(data,{
      id:'first-expense',
      type:'first',
      date:first.date,
      title:'Your first purchase became part of the story.',
      detail:`You recorded ${first.merchant||first.category} for ${fmt.format(n(first.amount))}.`,
      roadmapId:null
    })||changed;
  }

  const firstWeekly=checkins.find(item=>item.type==='weekly');
  if(firstWeekly){
    changed=addMemory(data,{
      id:'first-weekly-checkin',
      type:'checkin',
      date:firstWeekly.date,
      title:'You created your first weekly reference point.',
      detail:'WealthOS gained a wider view than a single day.',
      roadmapId:null
    })||changed;
  }

  const firstMonthly=checkins.find(item=>item.type==='monthly');
  if(firstMonthly){
    changed=addMemory(data,{
      id:'first-monthly-checkin',
      type:'checkin',
      date:firstMonthly.date,
      title:'You completed your first monthly chapter.',
      detail:'Income, spending, and saving were remembered together.',
      roadmapId:null
    })||changed;
  }

  const weeklyDates=[...new Set(checkins.filter(item=>item.type==='weekly').map(item=>item.date))].sort();
  if(weeklyDates.length>=3){
    const recent=weeklyDates.slice(-3).map(value=>new Date(`${value}T12:00:00`));
    const consecutive=recent.every((date,index)=>index===0||Math.round((date-recent[index-1])/86400000)<=10);
    if(consecutive){
      changed=addMemory(data,{
        id:'three-weekly-checkins',
        type:'consistency',
        date:weeklyDates.at(-1),
        title:'Three weekly check-ins are beginning to form continuity.',
        detail:'This is enough history to begin separating isolated weeks from recurring patterns.',
        roadmapId:null
      })||changed;
    }
  }

  (data.roadmaps||[]).forEach(roadmap=>{
    const target=n(roadmap.target);
    const saved=n(roadmap.saved);
    if(target<=0)return;
    const pct=saved/target*100;
    [25,50,75,100].forEach(threshold=>{
      if(pct>=threshold){
        changed=addMemory(data,{
          id:`roadmap-${roadmap.id}-${threshold}`,
          type:'roadmap',
          date:localDateKey(),
          title:threshold===100?`${roadmap.name} reached its destination.`:`${roadmap.name} crossed ${threshold}%.`,
          detail:threshold===100
            ? `You completed the ${fmt.format(target)} target.`
            : `${fmt.format(saved)} is now set aside toward a ${fmt.format(target)} target.`,
          roadmapId:roadmap.id
        })||changed;
      }
    });
  });

  data.memories.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  if(changed)saveData(syncLegacyChallenge(data));
  return data;
}

function openRoadmapModal(roadmapId=''){
  const data=loadData();
  const roadmap=(data.roadmaps||[]).find(item=>item.id===roadmapId)||null;
  $('roadmapModalTitle').textContent=roadmap?'Update this Roadmap.':'Create a Roadmap.';
  $('roadmapId').value=roadmap?.id||'';
  $('roadmapName').value=roadmap?.name||'';
  $('roadmapType').value=roadmap?.type||'emergency';
  $('roadmapTarget').value=roadmap?.target||'';
  $('roadmapSaved').value=roadmap?.saved||'';
  $('roadmapMonthlyContribution').value=roadmap?.monthlyContribution||'';
  $('roadmapStartDate').value=roadmap?.startDate||localDateKey();
  $('roadmapTargetDate').value=roadmap?.targetDate||'';
  $('roadmapModal').classList.add('open');
  $('roadmapModal').setAttribute('aria-hidden','false');
  setTimeout(()=>$('roadmapName').focus(),80);
}

function closeRoadmapModal(){
  $('roadmapModal').classList.remove('open');
  $('roadmapModal').setAttribute('aria-hidden','true');
}

function saveRoadmap(event){
  event.preventDefault();
  const data=loadData();
  const id=$('roadmapId').value||`roadmap-${Date.now()}`;
  const roadmap={
    id,
    name:$('roadmapName').value.trim()||'Roadmap',
    type:$('roadmapType').value||'other',
    target:Math.max(1,n($('roadmapTarget').value)),
    saved:Math.max(0,n($('roadmapSaved').value)),
    monthlyContribution:Math.max(0,n($('roadmapMonthlyContribution').value)),
    startDate:$('roadmapStartDate').value||localDateKey(),
    targetDate:$('roadmapTargetDate').value,
    status:'active'
  };
  roadmap.saved=Math.min(roadmap.saved,roadmap.target);
  const index=(data.roadmaps||[]).findIndex(item=>item.id===id);
  if(index>=0)data.roadmaps[index]=roadmap;
  else data.roadmaps.push(roadmap);
  restoreDerivedState(data);
  saveData(data);
  closeRoadmapModal();
  render(data);
  location.hash='roadmaps';
}

function renderRoadmaps(data,fmt){
  const grid=$('roadmapGrid');
  grid.innerHTML='';
  const roadmaps=activeRoadmaps(data);

  if(!roadmaps.length){
    const empty=document.createElement('article');
    empty.className='empty-roadmap';
    empty.innerHTML='<h4>Where are you going?</h4><p>Create a Roadmap for an emergency fund, a trip, debt payoff, a home, or another future that matters to you.</p><button type="button">Create your first Roadmap</button>';
    empty.querySelector('button').addEventListener('click',()=>openRoadmapModal());
    grid.append(empty);
    return;
  }

  roadmaps.forEach(roadmap=>{
    const target=n(roadmap.target);
    const saved=Math.min(target,n(roadmap.saved));
    const pct=target>0?Math.min(100,saved/target*100):0;
    const card=document.createElement('article');
    card.className='roadmap-card';
    card.innerHTML=`
      <div class="roadmap-card-top">
        <span class="roadmap-card-type">${roadmapTypeLabel(roadmap.type)}</span>
        <button class="roadmap-menu" type="button" aria-label="Edit ${roadmap.name}">Edit</button>
      </div>
      <h4>${roadmap.name}</h4>
      <div class="roadmap-numbers">
        <div><span>Today’s balance</span><strong>${fmt.format(saved)}</strong></div>
        <div><span>Target</span><strong>${fmt.format(target)}</strong></div>
      </div>
      <div class="roadmap-track"><span style="width:${pct}%"></span></div>
      <div class="roadmap-progress-copy"><span>${pct.toFixed(0)}% complete</span><span>${estimatedRoadmapTiming(roadmap)}</span></div>
      <div class="roadmap-next"><span>Next milestone</span><strong>${roadmapNextMilestone(roadmap,fmt)}</strong></div>
      <div class="roadmap-actions">
        <button class="roadmap-contribute" type="button">Add contribution</button>
        <button class="roadmap-review" type="button">Review progress</button>
      </div>
    `;
    card.querySelector('.roadmap-menu').addEventListener('click',()=>openRoadmapModal(roadmap.id));
    card.querySelector('.roadmap-contribute').addEventListener('click',()=>openContribution(roadmap.id));
    card.querySelector('.roadmap-review').addEventListener('click',()=>location.hash='timeline');
    grid.append(card);
  });
}

function renderFinancialMemory(data){
  const strip=$('memoryStrip');
  strip.innerHTML='';
  const memories=(data.memories||[]).slice(0,3);

  if(!memories.length){
    const card=document.createElement('article');
    card.className='memory-card';
    card.innerHTML='<time>Waiting for a first moment</time><h4>Your financial story is ready to begin.</h4><p>Check-ins, Roadmap milestones, and meaningful changes will quietly appear here.</p><span>Financial Memory</span>';
    strip.append(card);
    return;
  }

  memories.forEach(memory=>{
    const card=document.createElement('article');
    card.className='memory-card';
    card.innerHTML=`<time>${formatDate(memory.date)}</time><h4>${memory.title}</h4><p>${memory.detail}</p><span>${memory.type==='roadmap'?'Roadmap moment':'Financial moment'}</span>`;
    strip.append(card);
  });
}



const LIBRARY_TYPES={
  expense:{label:'Expense',collection:'expenses',mark:'EX'},
  income:{label:'Income',collection:'incomes',mark:'IN'},
  account:{label:'Account',collection:'accounts',mark:'AC'},
  bill:{label:'Recurring bill',collection:'recurringBills',mark:'BI'},
  debt:{label:'Debt',collection:'debts',mark:'DE'},
  debt_payment:{label:'Debt payment',collection:'debtPayments',mark:'DP'},
  transfer:{label:'Transfer',collection:'transfers',mark:'TR'},
  roadmap_contribution:{label:'Roadmap contribution',collection:'checkins',mark:'RC'}
};

let selectedLibraryRecord=null;

function recordStatus(item){
  return ['active','archived','reversed'].includes(item?.status)?item.status:'active';
}

function activeOnly(items){
  return (items||[]).filter(item=>recordStatus(item)==='active');
}

function libraryRecords(data){
  const records=[];
  activeAndHistorical(data.expenses).forEach(item=>records.push({type:'expense',item}));
  activeAndHistorical(data.incomes).forEach(item=>records.push({type:'income',item}));
  activeAndHistorical(data.accounts).forEach(item=>records.push({type:'account',item}));
  activeAndHistorical(data.recurringBills).forEach(item=>records.push({type:'bill',item}));
  activeAndHistorical(data.debts).forEach(item=>records.push({type:'debt',item}));
  activeAndHistorical(data.debtPayments).forEach(item=>records.push({type:'debt_payment',item}));
  activeAndHistorical(data.transfers).forEach(item=>records.push({type:'transfer',item}));
  (data.checkins||[]).filter(item=>item.type==='contribution').forEach(item=>records.push({
    type:'roadmap_contribution',
    item:{...item,status:item.status||'active',source:normalizeSource(item.source)}
  }));
  return records.sort((a,b)=>recordSortDate(b.item).localeCompare(recordSortDate(a.item)));
}

function activeAndHistorical(items){
  return Array.isArray(items)?items:[];
}

function recordSortDate(item){
  return String(item.date||item.nextDueDate||item.dueDate||item.source?.updatedAt||item.source?.createdAt||'');
}

function recordTitle(type,item,data){
  if(type==='expense')return item.merchant||item.category||'Expense';
  if(type==='income')return item.sourceName||item.category||'Income';
  if(type==='account')return item.name||'Account';
  if(type==='bill')return item.name||'Recurring bill';
  if(type==='debt')return item.name||'Debt';
  if(type==='debt_payment'){
    const debt=(data.debts||[]).find(x=>x.id===item.debtId);
    return debt?`${debt.name} payment`:'Debt payment';
  }
  if(type==='transfer'){
    const from=(data.accounts||[]).find(x=>x.id===item.fromAccountId);
    const to=(data.accounts||[]).find(x=>x.id===item.toAccountId);
    return `${from?.name||'Account'} → ${to?.name||'Account'}`;
  }
  if(type==='roadmap_contribution')return item.roadmapName||'Roadmap contribution';
  return 'Record';
}

function recordSubtitle(type,item){
  if(type==='expense')return item.category||'Other';
  if(type==='income')return item.category||'Other income';
  if(type==='account')return item.type||'Account';
  if(type==='bill')return `${item.frequency||'monthly'} · expected`;
  if(type==='debt')return item.type||'Debt';
  if(type==='debt_payment')return formatDate(item.date);
  if(type==='transfer')return formatDate(item.date);
  if(type==='roadmap_contribution')return formatDate(item.date);
  return '';
}

function recordAmount(type,item){
  if(type==='expense'||type==='income'||type==='debt_payment'||type==='transfer'||type==='roadmap_contribution')return n(item.amount);
  if(type==='account'||type==='debt')return n(item.balance);
  if(type==='bill')return n(item.expectedAmount);
  return 0;
}

function sourceSummary(item){
  const source=normalizeSource(item.source);
  if(source.verified)return{title:'Verified source',text:`${source.method} · Verified`};
  if(source.imported)return{title:'Imported record',text:`${source.method} · Imported`};
  if(source.method==='calculated')return{title:'Calculated by WealthOS',text:'Derived from underlying records'};
  return{title:'Entered manually by you',text:'User-reported · Not bank-verified'};
}

function auditSnapshot(item){
  const clone=JSON.parse(JSON.stringify(item));
  delete clone.source;
  return clone;
}

function appendDetailedAudit(data,action,entityType,entity,before=null,after=null,detail=''){
  appendAudit(data,action,entityType,entity,detail);
  const entry=data.auditLog.at(-1);
  entry.before=before;
  entry.after=after;
}

function findRecord(data,type,id){
  if(type==='roadmap_contribution'){
    return (data.checkins||[]).find(item=>item.type==='contribution'&&String(item.id)===String(id))||null;
  }
  const config=LIBRARY_TYPES[type];
  return config?(data[config.collection]||[]).find(item=>String(item.id)===String(id))||null:null;
}


const libraryView={
  period:'all',
  recurringOnly:false,
  recentSearches:[]
};

function normalizeSearchText(value){
  return String(value??'')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[$,\s]+/g,' ')
    .trim();
}

function monthNameSearch(dateString){
  if(!dateString)return '';
  const date=new Date(`${String(dateString).slice(0,10)}T12:00:00`);
  if(Number.isNaN(date.getTime()))return '';
  return [
    date.toLocaleDateString(undefined,{month:'long'}),
    date.toLocaleDateString(undefined,{month:'short'}),
    String(date.getFullYear()),
    date.toLocaleDateString()
  ].join(' ');
}

function recordSearchDocument(type,item,data){
  const accountName=id=>(data.accounts||[]).find(x=>x.id===id)?.name||'';
  const roadmapName=id=>(data.roadmaps||[]).find(x=>x.id===id)?.name||item.roadmapName||'';
  const debtName=id=>(data.debts||[]).find(x=>x.id===id)?.name||'';
  const parts=[
    recordTitle(type,item,data),
    recordSubtitle(type,item),
    type,
    LIBRARY_TYPES[type]?.label,
    item.merchant,
    item.sourceName,
    item.name,
    item.category,
    item.type,
    item.note,
    item.amount,
    item.balance,
    item.expectedAmount,
    item.apr,
    item.frequency,
    recurrenceLabel(item),
    normalizeSource(item.source).method,
    recordStatus(item),
    recordSortDate(item),
    monthNameSearch(recordSortDate(item)),
    accountName(item.accountId),
    accountName(item.fromAccountId),
    accountName(item.toAccountId),
    roadmapName(item.roadmapId),
    debtName(item.debtId)
  ];
  return normalizeSearchText(parts.filter(value=>value!==undefined&&value!==null&&value!=='').join(' '));
}

function searchScore(query,type,item,data){
  if(!query)return 0;
  const q=normalizeSearchText(query);
  const title=normalizeSearchText(recordTitle(type,item,data));
  const subtitle=normalizeSearchText(recordSubtitle(type,item));
  const doc=recordSearchDocument(type,item,data);
  let score=0;
  if(title===q)score+=100;
  else if(title.startsWith(q))score+=70;
  else if(title.includes(q))score+=50;
  if(subtitle.includes(q))score+=25;
  if(doc.includes(q))score+=10;
  const amount=String(recordAmount(type,item));
  if(q.replace(/[^\d.]/g,'')&&amount.includes(q.replace(/[^\d.]/g,'')))score+=35;
  return score;
}

function libraryPeriodRange(period){
  const today=new Date();
  const end=localDateKey(today);
  if(period==='month'){
    return{from:`${end.slice(0,7)}-01`,to:end};
  }
  if(period==='30days'){
    const start=new Date(today);
    start.setDate(start.getDate()-29);
    return{from:localDateKey(start),to:end};
  }
  return{from:'',to:''};
}

function setLibraryPeriod(period){
  libraryView.period=period;
  document.querySelectorAll('[data-library-period]').forEach(button=>{
    button.classList.toggle('active',button.dataset.libraryPeriod===period);
  });
  renderRecordLibrary(loadData());
}

function setRecurringQuickFilter(enabled){
  libraryView.recurringOnly=enabled;
  document.querySelectorAll('[data-library-recurrence="recurring"]').forEach(button=>{
    button.classList.toggle('active',enabled);
  });
  renderRecordLibrary(loadData());
}

function toggleAdvancedFilters(){
  const panel=$('libraryAdvancedFilters');
  const opening=panel.hidden;
  panel.hidden=!opening;
  $('libraryMoreFilters').setAttribute('aria-expanded',String(opening));
  $('libraryMoreFilters').textContent=opening?'Fewer filters −':'More filters +';
}

function rememberLibrarySearch(query){
  const value=String(query||'').trim();
  if(value.length<2)return;
  libraryView.recentSearches=[
    value,
    ...libraryView.recentSearches.filter(item=>item.toLowerCase()!==value.toLowerCase())
  ].slice(0,5);
  renderLibrarySuggestions();
}

function renderLibrarySuggestions(){
  const holder=$('librarySuggestionChips');
  const section=$('librarySuggestions');
  holder.innerHTML='';
  if(!libraryView.recentSearches.length){
    section.hidden=true;
    return;
  }
  section.hidden=false;
  libraryView.recentSearches.forEach(value=>{
    const button=document.createElement('button');
    button.className='library-suggestion';
    button.type='button';
    button.textContent=value;
    button.addEventListener('click',()=>{
      $('librarySearch').value=value;
      $('libraryClearSearch').hidden=false;
      renderRecordLibrary(loadData());
    });
    holder.append(button);
  });
}

function clearLibrarySearch(){
  const current=$('librarySearch').value.trim();
  if(current)rememberLibrarySearch(current);
  $('librarySearch').value='';
  $('libraryClearSearch').hidden=true;
  renderRecordLibrary(loadData());
}

function resetLibraryView(){
  const current=$('librarySearch').value.trim();
  if(current)rememberLibrarySearch(current);
  $('librarySearch').value='';
  $('libraryClearSearch').hidden=true;
  $('libraryType').value='all';
  $('libraryRecurrence').value='all';
  $('librarySource').value='all';
  $('libraryDateFrom').value='';
  $('libraryDateTo').value='';
  libraryView.period='all';
  libraryView.recurringOnly=false;
  document.querySelectorAll('[data-library-period]').forEach(button=>{
    button.classList.toggle('active',button.dataset.libraryPeriod==='all');
  });
  document.querySelectorAll('[data-library-recurrence="recurring"]').forEach(button=>{
    button.classList.remove('active');
  });
  renderRecordLibrary(loadData());
}

function escapeHtml(value){
  return String(value??'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}

function highlightSearch(value,query){
  const text=String(value??'');
  const q=String(query||'').trim();
  if(!q)return escapeHtml(text);
  const index=text.toLowerCase().indexOf(q.toLowerCase());
  if(index<0)return escapeHtml(text);
  return escapeHtml(text.slice(0,index))+
    `<mark class="record-match">${escapeHtml(text.slice(index,index+q.length))}</mark>`+
    escapeHtml(text.slice(index+q.length));
}

function filteredLibraryRecords(data){
  const query=$('librarySearch').value.trim();
  const normalizedQuery=normalizeSearchText(query);
  const type=$('libraryType').value;
  const source=$('librarySource').value;
  const recurrenceFilter=$('libraryRecurrence').value;
  const period=libraryPeriodRange(libraryView.period);
  const manualFrom=$('libraryDateFrom').value;
  const manualTo=$('libraryDateTo').value;
  const from=manualFrom||period.from;
  const to=manualTo||period.to;

  return libraryRecords(data)
    .map(record=>({...record,score:searchScore(query,record.type,record.item,data)}))
    .filter(({type:recordType,item,score})=>{
      if(type!=='all'&&type!==recordType)return false;
      if(source!=='all'&&normalizeSource(item.source).method!==source)return false;

      const recurrence=normalizeRecurrence(item);
      if(libraryView.recurringOnly&&!isRecurring(item))return false;
      if(recurrenceFilter==='once'&&isRecurring(item))return false;
      if(recurrenceFilter==='recurring'&&!isRecurring(item))return false;
      if(!['all','once','recurring'].includes(recurrenceFilter)&&recurrence.frequency!==recurrenceFilter)return false;

      const date=recordSortDate(item).slice(0,10);
      if(from&&date&&date<from)return false;
      if(to&&date&&date>to)return false;

      if(normalizedQuery&&!recordSearchDocument(recordType,item,data).includes(normalizedQuery))return false;
      return true;
    })
    .sort((a,b)=>{
      if(normalizedQuery&&b.score!==a.score)return b.score-a.score;
      return recordSortDate(b.item).localeCompare(recordSortDate(a.item));
    });
}

function renderRecordLibrary(data){
  const fmt=money(data.profile.currency);
  const query=$('librarySearch').value.trim();
  const records=filteredLibraryRecords(data);
  const total=libraryRecords(data).length;

  $('libraryCount').textContent=`${records.length} record${records.length===1?'':'s'}`;
  $('libraryStatusText').textContent=query
    ? `Matching “${query}” across ${total} total record${total===1?'':'s'}.`
    : libraryView.period==='month'
      ? 'Showing records from this month.'
      : libraryView.period==='30days'
        ? 'Showing records from the last 30 days.'
        : libraryView.recurringOnly
          ? 'Showing records with recurring schedules.'
          : 'Showing your most recent records.';

  $('recordResultsLabel').textContent=query?'Search results':'Recent records';
  $('recordResultsTitle').textContent=query
    ? records.length===1?'1 matching record':`${records.length} matching records`
    : 'Your financial history';
  $('recordResultsMeta').textContent=query
    ? records.length?'Open a result to review or correct it.':'Try another word or clear the search.'
    : `${total} total record${total===1?'':'s'}`;

  $('libraryClearSearch').hidden=!query;
  $('librarySuggestions').hidden=Boolean(query);

  const list=$('recordList');
  list.innerHTML='';

  if(!records.length){
    const empty=document.createElement('div');
    empty.className='record-empty';
    empty.innerHTML=query
      ? `<strong>No record matched “${escapeHtml(query)}.”</strong><span>Try a merchant, account, bill, amount, category, month, or note. You do not need to fill in any other filter.</span>`
      : `<strong>No records match this view.</strong><span>Reset the view or record something new.</span>`;
    list.append(empty);
  }else{
    records.forEach(({type,item})=>{
      const row=document.createElement('article');
      const config=LIBRARY_TYPES[type];
      const status=recordStatus(item);
      const title=recordTitle(type,item,data);
      const subtitle=recordSubtitle(type,item);
      row.className='record-row';
      row.tabIndex=0;
      row.innerHTML=`
        <span class="record-row-mark">${config.mark}</span>
        <div class="record-row-main">
          <strong>${highlightSearch(title,query)}${isRecurring(item)?`<em class="recurring-badge">${recurrenceLabel(item)}</em>`:''}</strong>
          <span>${highlightSearch(subtitle,query)}</span>
        </div>
        <div class="record-row-meta">
          <strong>${formatDate(recordSortDate(item).slice(0,10))}</strong>
          <span>${normalizeSource(item.source).method}</span>
        </div>
        <div class="record-row-meta">
          <strong class="record-row-status ${status}">${status}</strong>
          <span>Revision ${Math.max(1,n(item.revision,1))}</span>
        </div>
        <strong class="record-row-amount">${fmt.format(recordAmount(type,item))}</strong>
      `;
      const open=()=>openRecordDetail(type,item.id);
      row.addEventListener('click',open);
      row.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){
          event.preventDefault();
          open();
        }
      });
      list.append(row);
    });
  }

  renderLibrarySuggestions();
  renderDataQuality(data);
  renderExpectedCommitments(data);
}

function dateAgeDays(dateString){
  if(!dateString)return null;
  const date=new Date(`${String(dateString).slice(0,10)}T12:00:00`);
  if(Number.isNaN(date.getTime()))return null;
  return Math.floor((new Date()-date)/86400000);
}

function dataQualityIssues(data){
  const issues=[];
  const fmt=money(data.profile.currency);

  const activeExpenses=activeOnly(data.expenses);
  const activeIncome=activeOnly(data.incomes);

  [...activeExpenses,...activeIncome].forEach((item,index,array)=>{
    const duplicate=array.find(other=>
      other!==item&&
      n(other.amount)===n(item.amount)&&
      String(other.date)===String(item.date)&&
      (
        String(other.merchant||other.sourceName||'').toLowerCase()===
        String(item.merchant||item.sourceName||'').toLowerCase()
      )
    );
    if(duplicate&&String(item.id)<String(duplicate.id)){
      issues.push({
        key:`dup-${item.id}`,
        title:'Possible duplicate record',
        text:`Two ${item.merchant||item.sourceName||'records'} entries share the same date and ${fmt.format(item.amount)} amount.`
      });
    }
  });

  activeOnly(data.transfers).forEach(item=>{
    if(item.fromAccountId&&item.fromAccountId===item.toAccountId){
      issues.push({key:`transfer-${item.id}`,title:'Transfer needs review',text:'The same account appears on both sides of this transfer.'});
    }
  });

  activeOnly(data.debtPayments).forEach(item=>{
    const debt=(data.debts||[]).find(x=>x.id===item.debtId);
    if(debt&&n(item.amount)>n(debt.balance)+n(item.amount)){
      issues.push({key:`payment-${item.id}`,title:'Payment may exceed the earlier balance',text:`The recorded payment is larger than the remaining balance now shown for ${debt.name}.`});
    }
  });

  activeOnly(data.recurringBills).forEach(item=>{
    if(!item.nextDueDate){
      issues.push({key:`bill-${item.id}`,title:'Bill has no due date',text:`${item.name} is recurring, but WealthOS does not yet know when it is next due.`});
    }
  });

  const candidates=[
    ...activeOnly(data.expenses).map(item=>({type:'expense',item,name:item.merchant||item.category})),
    ...activeOnly(data.incomes).map(item=>({type:'income',item,name:item.sourceName||item.category}))
  ];
  candidates.forEach(candidate=>{
    if(isRecurring(candidate.item))return;
    const matches=candidates.filter(other=>
      other!==candidate&&
      other.type===candidate.type&&
      String(other.name||'').toLowerCase()===String(candidate.name||'').toLowerCase()&&
      Math.abs(n(other.item.amount)-n(candidate.item.amount))<=Math.max(1,n(candidate.item.amount)*.05)
    );
    if(matches.length>=2){
      issues.push({
        key:`repeat-${candidate.item.id}`,
        title:'This may be recurring',
        text:`${candidate.name||'This record'} appears several times at a similar amount. You can label it recurring if that reflects reality.`
      });
    }
  });

  activeOnly(data.accounts).forEach(item=>{
    const age=dateAgeDays(item.source?.updatedAt||item.source?.createdAt);
    if(age!==null&&age>30){
      issues.push({key:`account-${item.id}`,title:'Account balance may be stale',text:`${item.name} was last updated ${age} days ago.`});
    }
  });

  activeRoadmaps(data).forEach(item=>{
    if(n(item.saved)>n(item.target)){
      issues.push({key:`roadmap-${item.id}`,title:'Roadmap exceeds its target',text:`${item.name} shows more saved than its current target.`});
    }
  });

  return issues;
}

function renderDataQuality(data){
  const issues=dataQualityIssues(data);
  $('dataQualityCount').textContent=`${issues.length} item${issues.length===1?'':'s'}`;
  const list=$('dataQualityList');
  list.innerHTML='';
  if(!issues.length){
    const empty=document.createElement('p');
    empty.className='quality-empty';
    empty.textContent='Nothing urgent. Your records are internally consistent based on what WealthOS currently knows.';
    list.append(empty);
    return;
  }
  issues.forEach(issue=>{
    const row=document.createElement('article');
    row.className='quality-item';
    row.innerHTML=`<span class="quality-mark">?</span><div><strong>${issue.title}</strong><p>${issue.text}</p></div>`;
    list.append(row);
  });
}

function detailFields(type,item,data){
  const fmt=money(data.profile.currency);
  const accountName=id=>(data.accounts||[]).find(x=>x.id===id)?.name||'Not linked';
  const roadmapName=id=>(data.roadmaps||[]).find(x=>x.id===id)?.name||item.roadmapName||'Not linked';
  const debtName=id=>(data.debts||[]).find(x=>x.id===id)?.name||'Not linked';
  const fields=[];

  if(type==='expense'){
    fields.push(['Amount',fmt.format(item.amount)],['Category',item.category],['Date',formatDate(item.date)],['Account',accountName(item.accountId)],['Spending role',item.essential||'unknown'],['Note',item.note||'—']);
  }else if(type==='income'){
    fields.push(['Amount',fmt.format(item.amount)],['Income type',item.category],['Date',formatDate(item.date)],['Account',accountName(item.accountId)],['Month',item.month],['Note',item.note||'—']);
  }else if(type==='account'){
    fields.push(['Balance',fmt.format(item.balance)],['Account type',item.type],['Currency',item.currency],['Status',recordStatus(item)],['Note',item.note||'—']);
  }else if(type==='bill'){
    fields.push(['Expected amount',fmt.format(item.expectedAmount)],['Frequency',item.frequency],['Next due date',item.nextDueDate?formatDate(item.nextDueDate):'Not provided'],['Account',accountName(item.accountId)],['Status',recordStatus(item)],['Note',item.note||'—']);
  }else if(type==='debt'){
    fields.push(['Balance',fmt.format(item.balance)],['Debt type',item.type],['APR',item.apr===null?'Not provided':`${item.apr}%`],['Minimum payment',fmt.format(item.minimumPayment)],['Due date',item.dueDate?formatDate(item.dueDate):'Not provided'],['Status',recordStatus(item)]);
  }else if(type==='debt_payment'){
    fields.push(['Amount',fmt.format(item.amount)],['Debt',debtName(item.debtId)],['Date',formatDate(item.date)],['Account',accountName(item.accountId)],['Note',item.note||'—']);
  }else if(type==='transfer'){
    fields.push(['Amount',fmt.format(item.amount)],['From',accountName(item.fromAccountId)],['To',accountName(item.toAccountId)],['Date',formatDate(item.date)],['Note',item.note||'—']);
  }else if(type==='roadmap_contribution'){
    fields.push(['Amount',fmt.format(item.amount)],['Roadmap',roadmapName(item.roadmapId)],['Date',formatDate(item.date)],['Note',item.note||'—']);
  }

  const recurrence=normalizeRecurrence(item);
  fields.push(
    ['Schedule',recurrenceLabel(item)],
    ['Next expected',isRecurring(item)&&recurrence.nextExpectedDate?formatDate(recurrence.nextExpectedDate):'Not scheduled'],
    ['Amount behavior',isRecurring(item)?(recurrence.amountBehavior==='variable'?'May vary':'Usually fixed'):'—'],
    ['Revision',String(Math.max(1,n(item.revision,1)))],
    ['Status',recordStatus(item)]
  );
  return fields;
}

function openRecordDetail(type,id){
  const data=loadData();
  const item=findRecord(data,type,id);
  if(!item)return;
  selectedLibraryRecord={type,id:String(id)};
  const source=sourceSummary(item);
  $('recordDetailType').textContent=LIBRARY_TYPES[type]?.label||'Record';
  $('recordDetailTitle').textContent=recordTitle(type,item,data);
  $('recordDetailSubtitle').textContent=recordSubtitle(type,item);
  $('recordDetailSource').textContent=source.title;
  $('recordDetailSourceText').textContent=source.text;
  $('recordDetailGrid').innerHTML=detailFields(type,item,data).map(([label,value])=>
    `<div class="record-detail-field"><span>${label}</span><strong>${value}</strong></div>`
  ).join('');

  const issue=dataQualityIssues(data).find(issue=>issue.key.includes(String(id)));
  $('recordQualityNote').hidden=!issue;
  $('recordQualityNote').textContent=issue?`${issue.title}: ${issue.text}`:'';

  const audits=(data.auditLog||[]).filter(entry=>String(entry.entityId)===String(id)).sort((a,b)=>String(b.occurredAt).localeCompare(String(a.occurredAt)));
  $('recordAuditList').innerHTML=audits.length?audits.map(entry=>`
    <article class="audit-entry">
      <strong>${entry.action}</strong>
      <p>${entry.detail||'Record history updated.'}</p>
      <time>${new Date(entry.occurredAt).toLocaleString()}</time>
    </article>
  `).join(''):'<p class="quality-empty">No audit entries yet.</p>';

  const longLived=['account','bill','debt'].includes(type);
  const activity=['expense','income','debt_payment','transfer','roadmap_contribution'].includes(type);
  $('archiveRecordButton').hidden=!longLived||recordStatus(item)!=='active';
  $('reverseRecordButton').hidden=!activity||recordStatus(item)!=='active';
  $('editRecordButton').hidden=recordStatus(item)!=='active';
  $('makeRecurringButton').hidden=recordStatus(item)!=='active'||!['expense','income','bill','debt_payment','transfer','roadmap_contribution'].includes(type);
  $('makeRecurringButton').textContent=isRecurring(item)?'Edit recurring schedule':'Make recurring';

  $('recordDetailModal').classList.add('open');
  $('recordDetailModal').setAttribute('aria-hidden','false');
}

function closeRecordDetail(){
  $('recordDetailModal').classList.remove('open');
  $('recordDetailModal').setAttribute('aria-hidden','true');
}

function closeRecordEdit(){
  $('recordEditModal').classList.remove('open');
  $('recordEditModal').setAttribute('aria-hidden','true');
}

function editField(label,id,value,type='text',options=[]){
  if(type==='select'){
    return `<label>${label}<select id="${id}">${options.map(option=>`<option value="${option}" ${String(option)===String(value)?'selected':''}>${option}</option>`).join('')}</select></label>`;
  }
  return `<label>${label}<input id="${id}" type="${type}" value="${String(value??'').replace(/"/g,'&quot;')}"></label>`;
}

function openRecordEdit(){
  if(!selectedLibraryRecord)return;
  const data=loadData();
  const {type,id}=selectedLibraryRecord;
  const item=findRecord(data,type,id);
  if(!item)return;
  $('editRecordType').value=type;
  $('editRecordId').value=id;
  $('editReason').value='';
  $('recordEditError').hidden=true;
  const fields=[];

  if(type==='expense'){
    fields.push(editField('Amount','editAmount',item.amount,'number'));
    fields.push(editField('Date','editDate',item.date,'date'));
    fields.push(editField('Merchant or description','editName',item.merchant));
    fields.push(editField('Category','editCategory',item.category,'select',['Coffee','Food & Dining','Groceries','Transportation','Housing','Utilities','Shopping','Health','Entertainment','Travel','Subscriptions','Taxes','Insurance','Debt','Investment','Other']));
  }else if(type==='income'){
    fields.push(editField('Amount','editAmount',item.amount,'number'));
    fields.push(editField('Date','editDate',item.date,'date'));
    fields.push(editField('Source','editName',item.sourceName));
    fields.push(editField('Income type','editCategory',item.category,'select',['Salary','Freelance','Business','Benefits','Investment income','Gift','Other']));
  }else if(type==='account'){
    fields.push(editField('Name','editName',item.name));
    fields.push(editField('Balance','editBalance',item.balance,'number'));
    fields.push(editField('Account type','editCategory',item.type,'select',['Checking','Savings','Cash','Credit Card','Investment','Loan','Wallet','Other']));
  }else if(type==='bill'){
    fields.push(editField('Name','editName',item.name));
    fields.push(editField('Expected amount','editAmount',item.expectedAmount,'number'));
    fields.push(editField('Next due date','editDate',item.nextDueDate,'date'));
    fields.push(editField('Frequency','editCategory',item.frequency,'select',['weekly','biweekly','monthly','quarterly','annual']));
  }else if(type==='debt'){
    fields.push(editField('Name','editName',item.name));
    fields.push(editField('Balance','editBalance',item.balance,'number'));
    fields.push(editField('APR','editApr',item.apr??'','number'));
    fields.push(editField('Minimum payment','editMinimum',item.minimumPayment,'number'));
  }else if(type==='debt_payment'||type==='transfer'||type==='roadmap_contribution'){
    fields.push(editField('Amount','editAmount',item.amount,'number'));
    fields.push(editField('Date','editDate',item.date,'date'));
  }

  fields.push(`<label class="full-width">Note <span>Optional</span><textarea id="editNote" rows="3">${item.note||''}</textarea></label>`);
  $('recordEditFields').innerHTML=fields.join('');
  closeRecordDetail();
  $('recordEditModal').classList.add('open');
  $('recordEditModal').setAttribute('aria-hidden','false');
}

function restoreDerivedState(data){
  const originalAccountBalances=new Map((data.accounts||[]).map(item=>[item.id,n(item.openingBalance??item.balance)]));
  (data.accounts||[]).forEach(account=>{
    if(account.openingBalance===undefined)account.openingBalance=n(account.balance);
    account.balance=n(account.openingBalance);
  });

  (data.debts||[]).forEach(debt=>{
    if(debt.openingBalance===undefined)debt.openingBalance=n(debt.balance);
    debt.balance=n(debt.openingBalance);
  });

  (data.roadmaps||[]).forEach(roadmap=>{
    if(roadmap.openingSaved===undefined)roadmap.openingSaved=n(roadmap.saved);
    roadmap.saved=n(roadmap.openingSaved);
    roadmap.status=roadmap.saved>=n(roadmap.target)?'complete':'active';
  });

  activeOnly(data.incomes).forEach(item=>applyAccountDelta(data,item.accountId,n(item.amount)));
  activeOnly(data.expenses).forEach(item=>applyAccountDelta(data,item.accountId,-n(item.amount)));
  activeOnly(data.debtPayments).forEach(item=>{
    applyAccountDelta(data,item.accountId,-n(item.amount));
    const debt=(data.debts||[]).find(x=>x.id===item.debtId);
    if(debt)debt.balance=Math.max(0,n(debt.balance)-n(item.amount));
  });
  activeOnly(data.transfers).forEach(item=>{
    applyAccountDelta(data,item.fromAccountId,-n(item.amount));
    applyAccountDelta(data,item.toAccountId,n(item.amount));
  });
  (data.checkins||[]).filter(item=>item.type==='contribution'&&recordStatus(item)==='active').forEach(item=>{
    applyAccountDelta(data,item.accountId,-n(item.amount));
    const roadmap=(data.roadmaps||[]).find(x=>x.id===item.roadmapId);
    if(roadmap){
      roadmap.saved=Math.min(n(roadmap.target),n(roadmap.saved)+n(item.amount));
      roadmap.status=roadmap.saved>=n(roadmap.target)?'complete':'active';
    }
  });

  syncCanonicalIncomeToLegacy(data);
  syncLegacyChallenge(data);
  updateFinancialMemories(data);
  return data;
}

function saveRecordEdit(event){
  event.preventDefault();
  const data=loadData();
  const type=$('editRecordType').value;
  const id=$('editRecordId').value;
  const item=findRecord(data,type,id);
  if(!item)return;
  const before=auditSnapshot(item);

  const amountInput=$('editAmount');
  const balanceInput=$('editBalance');
  const dateInput=$('editDate');
  const nameInput=$('editName');
  const categoryInput=$('editCategory');
  const noteInput=$('editNote');

  if(amountInput&&n(amountInput.value)<=0){
    $('recordEditError').textContent='Enter an amount greater than zero.';
    $('recordEditError').hidden=false;
    return;
  }

  if(type==='expense'){
    item.amount=Math.max(0,n(amountInput.value));
    item.date=dateInput.value;
    item.merchant=nameInput.value.trim();
    item.category=categoryInput.value;
  }else if(type==='income'){
    item.amount=Math.max(0,n(amountInput.value));
    item.date=dateInput.value;
    item.month=item.date.slice(0,7);
    item.sourceName=nameInput.value.trim();
    item.category=categoryInput.value;
  }else if(type==='account'){
    item.name=nameInput.value.trim();
    item.openingBalance=n(balanceInput.value);
    item.balance=n(balanceInput.value);
    item.type=categoryInput.value;
  }else if(type==='bill'){
    item.name=nameInput.value.trim();
    item.expectedAmount=Math.max(0,n(amountInput.value));
    item.nextDueDate=dateInput.value;
    item.frequency=categoryInput.value;
  }else if(type==='debt'){
    item.name=nameInput.value.trim();
    item.openingBalance=Math.max(0,n(balanceInput.value));
    item.balance=item.openingBalance;
    item.apr=$('editApr').value===''?null:Math.max(0,n($('editApr').value));
    item.minimumPayment=Math.max(0,n($('editMinimum').value));
  }else if(['debt_payment','transfer','roadmap_contribution'].includes(type)){
    item.amount=Math.max(0,n(amountInput.value));
    item.date=dateInput.value;
  }

  item.note=noteInput?.value.trim()||'';
  item.revision=Math.max(1,n(item.revision,1))+1;
  item.source=normalizeSource({...item.source,updatedAt:new Date().toISOString()});
  const after=auditSnapshot(item);
  appendDetailedAudit(data,'corrected',type,item,before,after,$('editReason').value.trim()||'Record corrected');
  restoreDerivedState(data);
  saveData(data);
  closeRecordEdit();
  render(data);
  renderRecordLibrary(data);
  openRecordDetail(type,id);
}

function archiveSelectedRecord(){
  if(!selectedLibraryRecord)return;
  const data=loadData();
  const {type,id}=selectedLibraryRecord;
  const item=findRecord(data,type,id);
  if(!item||recordStatus(item)!=='active')return;
  const before=auditSnapshot(item);
  item.status='archived';
  item.archivedAt=new Date().toISOString();
  item.revision=Math.max(1,n(item.revision,1))+1;
  appendDetailedAudit(data,'archived',type,item,before,auditSnapshot(item),'Record archived; historical activity retained');
  restoreDerivedState(data);
  saveData(data);
  closeRecordDetail();
  render(data);
  renderRecordLibrary(data);
}

function reverseSelectedRecord(){
  if(!selectedLibraryRecord)return;
  const data=loadData();
  const {type,id}=selectedLibraryRecord;
  const item=findRecord(data,type,id);
  if(!item||recordStatus(item)!=='active')return;
  const reason=prompt('Why are you reversing this record? This can be brief.')||'Record reversed by user';
  const before=auditSnapshot(item);
  item.status='reversed';
  item.reversedAt=new Date().toISOString();
  item.reversalReason=reason;
  item.revision=Math.max(1,n(item.revision,1))+1;
  appendDetailedAudit(data,'reversed',type,item,before,auditSnapshot(item),reason);
  restoreDerivedState(data);
  saveData(data);
  closeRecordDetail();
  render(data);
  renderRecordLibrary(data);
}


function updateRecurrenceFields(prefix='record'){
  const frequency=$(prefix==='record'?'recordRecurrence':'recurringFrequency').value;
  const recurring=frequency!=='once';
  const root=prefix==='record'?$('recurrenceFields'):$('recurringForm');

  root.querySelectorAll('.recurrence-dependent').forEach(element=>element.hidden=!recurring);
  root.querySelectorAll('.recurrence-custom,.recurring-custom-field').forEach(element=>element.hidden=frequency!=='custom');

  if(prefix==='record'){
    const title=$('recurrenceExplainerTitle');
    const text=$('recurrenceExplainerText');
    if(!recurring){
      title.textContent='One-time record';
      text.textContent='This affects history once and creates no future expectation.';
    }else{
      title.textContent=`Expected ${recurrenceLabel({recurrence:{frequency,customInterval:n($('recordCustomInterval').value,1),customUnit:$('recordCustomUnit').value}}).toLowerCase()}`;
      text.textContent='This creates an expectation only. Spending, income, and balances change only when the actual activity is recorded.';
    }
  }
}

function defaultNextExpectedDate(dateString,frequency){
  if(!dateString||frequency==='once')return '';
  return addInterval(dateString,{frequency,active:true,customInterval:1,customUnit:'months'});
}

function expectedRecurringRecords(data,daysAhead=45){
  const today=localDateKey();
  const horizon=new Date();
  horizon.setDate(horizon.getDate()+daysAhead);
  const horizonKey=localDateKey(horizon);
  return libraryRecords(data)
    .filter(({item})=>{
      const recurrence=normalizeRecurrence(item);
      return recordStatus(item)==='active'&&isRecurring(item)&&
        recurrence.nextExpectedDate&&
        recurrence.nextExpectedDate>=today&&
        recurrence.nextExpectedDate<=horizonKey&&
        (!recurrence.endDate||recurrence.nextExpectedDate<=recurrence.endDate);
    })
    .sort((a,b)=>normalizeRecurrence(a.item).nextExpectedDate.localeCompare(normalizeRecurrence(b.item).nextExpectedDate));
}

function renderExpectedCommitments(data){
  const records=expectedRecurringRecords(data);
  $('expectedCommitmentCount').textContent=`${records.length} upcoming`;
  const list=$('expectedCommitmentList');
  list.innerHTML='';
  if(!records.length){
    list.innerHTML='<p class="quality-empty">No recurring activity is expected in the next 45 days based on current records.</p>';
    return;
  }
  records.forEach(({type,item})=>{
    const recurrence=normalizeRecurrence(item);
    const row=document.createElement('article');
    row.className='expected-item';
    row.innerHTML=`
      <span class="expected-item-mark">${LIBRARY_TYPES[type]?.mark||'RE'}</span>
      <div>
        <strong>${recordTitle(type,item,data)}</strong>
        <p>${recurrenceLabel(item)} · ${recurrence.amountBehavior==='variable'?'Amount may vary':'Expected amount is usually fixed'}</p>
      </div>
      <time>${formatDate(recurrence.nextExpectedDate)}</time>
    `;
    row.addEventListener('click',()=>openRecordDetail(type,item.id));
    list.append(row);
  });
}

function openRecurringModal(){
  if(!selectedLibraryRecord)return;
  const data=loadData();
  const {type,id}=selectedLibraryRecord;
  const item=findRecord(data,type,id);
  if(!item)return;
  const recurrence=normalizeRecurrence(item);
  $('recurringRecordType').value=type;
  $('recurringRecordId').value=id;
  $('recurringFrequency').value=recurrence.frequency==='once'?'monthly':recurrence.frequency;
  $('recurringAmountBehavior').value=recurrence.amountBehavior;
  $('recurringNextDate').value=recurrence.nextExpectedDate||defaultNextExpectedDate(recordSortDate(item).slice(0,10),'monthly');
  $('recurringEndDate').value=recurrence.endDate;
  $('recurringCustomInterval').value=recurrence.customInterval;
  $('recurringCustomUnit').value=recurrence.customUnit;
  updateRecurrenceFields('recurring');
  closeRecordDetail();
  $('recurringModal').classList.add('open');
  $('recurringModal').setAttribute('aria-hidden','false');
}

function closeRecurringModal(){
  $('recurringModal').classList.remove('open');
  $('recurringModal').setAttribute('aria-hidden','true');
}

function saveRecurringSchedule(event){
  event.preventDefault();
  const data=loadData();
  const type=$('recurringRecordType').value;
  const id=$('recurringRecordId').value;
  const item=findRecord(data,type,id);
  if(!item)return;
  const before=auditSnapshot(item);
  item.recurrence=recurrenceFromForm('recurring');
  item.recurrence.createdFromRecordId=String(item.id);
  item.revision=Math.max(1,n(item.revision,1))+1;
  item.source=normalizeSource({...item.source,updatedAt:new Date().toISOString()});
  appendDetailedAudit(
    data,
    'recurrence_updated',
    type,
    item,
    before,
    auditSnapshot(item),
    `Recurring schedule set to ${recurrenceLabel(item)}`
  );
  saveData(data);
  closeRecurringModal();
  render(data);
  renderRecordLibrary(data);
  openRecordDetail(type,id);
}

function advanceRecurringExpectation(data,type,item,actualDate){
  if(!isRecurring(item))return;
  const recurrence=normalizeRecurrence(item);
  const next=addInterval(actualDate||recurrence.nextExpectedDate,recurrence);
  if(recurrence.endDate&&next>recurrence.endDate){
    item.recurrence={...recurrence,active:false,nextExpectedDate:''};
  }else{
    item.recurrence={...recurrence,nextExpectedDate:next};
  }
}
const RECORD_EXPLAINERS={
  expense:'Money went out. This updates Today, This Week, This Month, category context, and observations.',
  income:'Money came in. This updates monthly income, cash-flow context, and the Paycheck object.',
  bill:'A recurring obligation was identified. WealthOS will treat it as expected—not as already paid.',
  account:'A manual balance was reported. WealthOS will label it as user-reported until account connections exist.',
  debt:'An amount owed was reported. WealthOS will not infer affordability or repayment advice from balance alone.',
  debt_payment:'A payment reduced a recorded debt balance and became part of financial history.',
  transfer:'Money moved between accounts. Transfers do not count as income or spending.',
  roadmap_contribution:'Money was assigned to a Roadmap. This updates its progress and Financial Memory.'
};

function renderRecordSelectOptions(data){
  const accountOptions='<option value="">No account selected</option>'+
    (data.accounts||[]).map(item=>`<option value="${item.id}">${item.name} · ${item.type}</option>`).join('');
  $('recordAccountId').innerHTML=accountOptions;
  $('recordFromAccount').innerHTML='<option value="">Choose an account</option>'+
    (data.accounts||[]).map(item=>`<option value="${item.id}">${item.name}</option>`).join('');
  $('recordToAccount').innerHTML='<option value="">Choose an account</option>'+
    (data.accounts||[]).map(item=>`<option value="${item.id}">${item.name}</option>`).join('');
  $('recordDebtId').innerHTML=(data.debts||[]).length
    ? (data.debts||[]).map(item=>`<option value="${item.id}">${item.name} · ${money(data.profile.currency).format(item.balance)}</option>`).join('')
    : '<option value="">Record a debt first</option>';
  $('recordRoadmapId').innerHTML=activeRoadmaps(data).length
    ? activeRoadmaps(data).map(item=>`<option value="${item.id}">${item.name}</option>`).join('')
    : '<option value="">Create a Roadmap first</option>';
}

function updateRecordFields(){
  const type=$('recordType').value;
  document.querySelectorAll('#recordFields [data-types]').forEach(element=>{
    const visible=element.dataset.types.split(/\s+/).includes(type);
    element.hidden=!visible;
    element.querySelectorAll('input,select,textarea').forEach(control=>control.disabled=!visible);
  });
  $('recordTypeExplainer').textContent=RECORD_EXPLAINERS[type]||'Record a financial fact.';
  updateRecurrenceFields('record');
  const context={
    expense:'This will update actual spending.',
    income:'This will update recorded income.',
    bill:'This will create an expected recurring bill. It will not count as paid spending.',
    account:'This will store a user-reported account balance.',
    debt:'This will store a user-reported debt balance.',
    debt_payment:'This will reduce the selected recorded debt.',
    transfer:'This will move value between two recorded accounts without counting as income or spending.',
    roadmap_contribution:'This will update the selected Roadmap.'
  };
  $('recordSaveContextText').textContent=context[type]||'This will be stored as a user-reported record.';
  $('recordError').hidden=true;
}

function resetRecordForm(type='expense'){
  $('recordForm').reset();
  $('recordType').value=type;
  $('recordDate').value=localDateKey();
  $('recordRecurrence').value=type==='bill'?'monthly':'once';
  $('recordAmountBehavior').value=type==='bill'?'variable':'fixed';
  $('recordNextExpectedDate').value=type==='bill'?defaultNextExpectedDate(localDateKey(),'monthly'):'';
  $('recordRecurrenceEndDate').value='';
  $('recordCustomInterval').value='1';
  $('recordCustomUnit').value='months';
  $('recordError').hidden=true;
  updateRecordFields();
}

function openRecordModal(type='expense'){
  const data=loadData();
  if(!hasMeaningfulData(data)&&!data.onboardingComplete){
    openOnboarding();
    return;
  }
  renderRecordSelectOptions(data);
  resetRecordForm(type);
  $('recordModal').classList.add('open');
  $('recordModal').setAttribute('aria-hidden','false');
  setTimeout(()=>{
    const first=[...document.querySelectorAll('#recordFields input:not([disabled]),#recordFields select:not([disabled])')][0];
    first?.focus();
  },80);
}

function closeRecordModal(){
  $('recordModal').classList.remove('open');
  $('recordModal').setAttribute('aria-hidden','true');
}

function recordError(message){
  $('recordError').textContent=message;
  $('recordError').hidden=false;
}

function saveCoreRecord(event){
  event.preventDefault();
  const data=loadData();
  const type=$('recordType').value;
  const amount=Math.max(0,n($('recordAmount').value));
  const date=$('recordDate').value||localDateKey();
  const note=$('recordNote').value.trim();
  const source=manualSource();
  let entity=null;

  if(['expense','income','debt_payment','transfer','roadmap_contribution'].includes(type)&&amount<=0){
    recordError('Enter an amount greater than zero.');
    return;
  }

  if(type==='expense'){
    entity=canonicalExpense({
      id:coreId('expense'),
      amount,
      category:$('recordExpenseCategory').value||'Other',
      merchant:$('recordName').value.trim(),
      date,
      note,
      accountId:$('recordAccountId').value||null,
      essential:$('recordEssential').value,
      recurrence:recurrenceFromForm('record'),
      source
    });
    data.expenses.push(entity);
    applyAccountDelta(data,entity.accountId,-amount);
    data.memory={...(data.memory||{}),lastInteraction:'expense',lastCheckinDate:date,lastSummary:`You recorded ${money(data.profile.currency).format(amount)} for ${entity.category}.`};
    appendAudit(data,'created','expense',entity,'Manual expense recorded');
  }

  if(type==='income'){
    entity=canonicalIncome({
      id:coreId('income'),
      amount,
      category:$('recordIncomeCategory').value||'Other',
      sourceName:$('recordName').value.trim()||$('recordIncomeCategory').value||'Income',
      date,
      month:date.slice(0,7),
      accountId:$('recordAccountId').value||null,
      note,
      recurrence:recurrenceFromForm('record'),
      source
    });
    data.incomes.push(entity);
    applyAccountDelta(data,entity.accountId,amount);
    syncCanonicalIncomeToLegacy(data);
    data.memory={...(data.memory||{}),lastInteraction:'income',lastCheckinDate:date,lastSummary:`You recorded ${money(data.profile.currency).format(amount)} of income.`};
    appendAudit(data,'created','income',entity,'Manual income recorded');
  }

  if(type==='account'){
    const name=$('recordName').value.trim();
    if(!name){recordError('Give this account a name.');return}
    entity={
      id:coreId('account'),
      name,
      type:$('recordAccountType').value||'Other',
      balance:n($('recordBalance').value),
      openingBalance:n($('recordBalance').value),
      currency:data.profile.currency,
      note,
      source
    };
    Object.assign(entity,normalizeRecordState(entity));
    data.accounts.push(entity);
    appendAudit(data,'created','account',entity,'Manual account balance reported');
  }

  if(type==='bill'){
    const name=$('recordName').value.trim();
    const recurrence=recurrenceFromForm('record');
    if(!name){recordError('Give this recurring bill a name.');return}
    if(recurrence.frequency==='once'){
      recordError('A recurring bill needs a repeating schedule.');
      return;
    }
    if(!recurrence.nextExpectedDate){
      recordError('Add the next expected date so WealthOS knows when to anticipate this bill.');
      return;
    }
    entity={
      id:coreId('bill'),
      name,
      expectedAmount:Math.max(0,n($('recordExpectedAmount').value)),
      frequency:recurrence.frequency,
      nextDueDate:recurrence.nextExpectedDate,
      accountId:$('recordAccountId').value||null,
      note,
      active:true,
      recurrence,
      source
    };
    Object.assign(entity,normalizeRecordState(entity));
    data.recurringBills.push(entity);
    appendAudit(data,'created','recurringBill',entity,'Expected recurring bill recorded');
  }

  if(type==='debt'){
    const name=$('recordName').value.trim();
    if(!name){recordError('Give this debt a name.');return}
    entity={
      id:coreId('debt'),
      name,
      type:$('recordDebtType').value||'Other',
      balance:Math.max(0,n($('recordBalance').value)),
      openingBalance:Math.max(0,n($('recordBalance').value)),
      apr:$('recordApr').value===''?null:Math.max(0,n($('recordApr').value)),
      minimumPayment:Math.max(0,n($('recordMinimumPayment').value)),
      dueDate:$('recordDebtDueDate').value,
      accountId:$('recordAccountId').value||null,
      note,
      recurrence:recurrenceFromForm('record'),
      source
    };
    Object.assign(entity,normalizeRecordState(entity));
    data.debts.push(entity);
    appendAudit(data,'created','debt',entity,'Manual debt balance reported');
  }

  if(type==='debt_payment'){
    const debtId=$('recordDebtId').value;
    const debt=(data.debts||[]).find(item=>item.id===debtId);
    if(!debt){recordError('Record or choose a debt first.');return}
    entity={
      id:coreId('debt-payment'),
      debtId,
      amount,
      date,
      accountId:$('recordAccountId').value||null,
      note,
      source
    };
    Object.assign(entity,normalizeRecordState(entity));
    data.debtPayments.push(entity);
    const oldBalance=n(debt.balance);
    debt.balance=Math.max(0,oldBalance-amount);
    applyAccountDelta(data,entity.accountId,-amount);
    appendAudit(data,'created','debtPayment',entity,`Debt balance changed from ${oldBalance} to ${debt.balance}`);
    appendAudit(data,'updated','debt',debt,'Balance reduced by a recorded payment');
  }

  if(type==='transfer'){
    const fromAccountId=$('recordFromAccount').value||null;
    const toAccountId=$('recordToAccount').value||null;
    if(!fromAccountId||!toAccountId||fromAccountId===toAccountId){
      recordError('Choose two different accounts for the transfer.');
      return;
    }
    entity={id:coreId('transfer'),fromAccountId,toAccountId,amount,date,note,recurrence:recurrenceFromForm('record'),source};
    Object.assign(entity,normalizeRecordState(entity));
    data.transfers.push(entity);
    applyAccountDelta(data,fromAccountId,-amount);
    applyAccountDelta(data,toAccountId,amount);
    appendAudit(data,'created','transfer',entity,'Transfer recorded without counting it as income or spending');
  }

  if(type==='roadmap_contribution'){
    const roadmapId=$('recordRoadmapId').value;
    const roadmap=(data.roadmaps||[]).find(item=>item.id===roadmapId);
    if(!roadmap){recordError('Create or choose a Roadmap first.');return}
    entity={
      id:coreId('roadmap-contribution'),
      roadmapId,
      amount,
      date,
      accountId:$('recordAccountId').value||null,
      note,
      source
    };
    const before=n(roadmap.saved);
    roadmap.saved=Math.min(n(roadmap.target),before+amount);
    roadmap.status=roadmap.saved>=n(roadmap.target)?'complete':'active';
    applyAccountDelta(data,entity.accountId,-amount);
    data.checkins.push({id:entity.id,type:'contribution',date,amount,roadmapId,roadmapName:roadmap.name,accountId:entity.accountId,note,status:'active',revision:1,source});
    data.memory={...(data.memory||{}),lastInteraction:'roadmap',lastCheckinDate:date,lastSummary:`You added ${money(data.profile.currency).format(amount)} to ${roadmap.name}.`};
    appendAudit(data,'created','roadmapContribution',entity,`Roadmap progress changed from ${before} to ${roadmap.saved}`);
    appendAudit(data,'updated','roadmap',roadmap,'Progress updated by a recorded contribution');
  }

  if(entity&&['expense','income','debt_payment','transfer','roadmap_contribution'].includes(type)&&isRecurring(entity)){
    advanceRecurringExpectation(data,type,entity,date);
  }

  data.schemaVersion='1.0.0';
  data.onboardingComplete=true;
  syncLegacyChallenge(data);
  updateFinancialMemories(data);
  saveData(data);
  closeRecordModal();
  render(data);

  if(type==='expense'){
    showExpenseToast(entity,data);
  }else if(type==='bill'){
    location.hash='recordLibrary';
    setTimeout(()=>openRecordDetail('bill',entity.id),120);
  }else{
    location.hash=type==='roadmap_contribution'?'roadmaps':'coreFoundation';
  }
}

function renderCoreFoundation(data){
  const state=knowledgeState(data);
  const count=currentEntityCount(data);
  $('foundationState').textContent=state.label;
  $('foundationStateText').textContent=state.text;
  $('foundationRecordCount').textContent=String(count);
  $('foundationRecordText').textContent=count
    ? `${count} core record${count===1?'':'s'} across ${Object.values(state.counts).filter(Boolean).length} financial domain${Object.values(state.counts).filter(Boolean).length===1?'':'s'}.`
    : 'No financial records yet.';
  $('foundationSource').textContent=(data.accounts||[]).some(x=>x.source?.verified)?'Mixed':'Manual';

  const entries=[
    ['Income',state.counts.income,'Money coming in'],
    ['Expenses',state.counts.expenses,'Money going out'],
    ['Accounts',state.counts.accounts,'Where money lives'],
    ['Bills',state.counts.bills,'Expected obligations'],
    ['Debts',state.counts.debts,'Amounts owed'],
    ['Roadmaps',state.counts.roadmaps,'Where money is going'],
    ['History',state.daySpan?`${state.daySpan} days`:'New','Recorded time span'],
    ['Audit log',(data.auditLog||[]).length,'Traceable changes']
  ];
  $('foundationEntities').innerHTML=entries.map(([name,value,description])=>
    `<article class="foundation-entity"><span>${name}</span><strong>${value}</strong><small>${description}</small></article>`
  ).join('');
}

function checkinInCurrentWeek(data){
  const start=startOfWeek(new Date());
  return (data.checkins||[]).some(item=>{
    if(item.type!=='weekly'||!item.date)return false;
    const date=new Date(`${item.date}T12:00:00`);
    return date>=start;
  });
}

function monthlyCheckinExists(data){
  return (data.checkins||[]).some(item=>item.type==='monthly'&&String(item.date).slice(0,7)===currentMonthKey());
}

function chooseWorkspaceFocus(data){
  const todayRecords=expensesForPeriod(data,'daily');
  if(!todayRecords.length){
    return{
      title:'Record today’s spending.',
      text:'One small record gives today a clearer financial picture.',
      label:'Quick Add',
      time:'About 20 seconds',
      action:'quickAdd'
    };
  }

  if(!checkinInCurrentWeek(data)){
    return{
      title:'Turn this week into a reference point.',
      text:'A Weekly Check-in helps WealthOS distinguish today from the wider week.',
      label:'Weekly Check-in',
      time:'About 30 seconds',
      action:'weekly'
    };
  }

  if(new Date().getDate()>=25&&!monthlyCheckinExists(data)){
    return{
      title:'Close the month with clarity.',
      text:'Record income, spending, and saving before the next month begins.',
      label:'Monthly Check-in',
      time:'About 60 seconds',
      action:'monthly'
    };
  }

  const focusRoadmap=primaryRoadmap(data);
  if(focusRoadmap&&n(focusRoadmap.target)>n(focusRoadmap.saved)){
    return{
      title:`Continue ${focusRoadmap.name}.`,
      text:'One contribution can keep this Roadmap moving without turning today into a full financial review.',
      label:'Add contribution',
      time:'About 20 seconds',
      action:'contribution'
    };
  }

  return{
    title:'See what today added to your story.',
    text:'Your Snapshot is ready with today’s records and WealthOS’s latest observation.',
    label:'Review Snapshot',
    time:'About 30 seconds',
    action:'snapshot'
  };
}

function chooseWorkspaceContinue(data){
  const memory=data.memory||{};
  if(memory.lastInteraction==='expense'){
    return{
      title:'Continue with today’s picture.',
      text:memory.lastSummary||'Your latest purchase is now part of Today, This Week, and This Month.',
      label:'View Snapshot',
      action:'snapshot'
    };
  }

  if(memory.lastInteraction==='checkin'){
    return{
      title:'Return to the chapter you added.',
      text:memory.lastSummary||'Your latest check-in is now part of your Timeline.',
      label:'Open Timeline',
      action:'timeline'
    };
  }

  const roadmap=primaryRoadmap(data);
  if(roadmap){
    return{
      title:`Continue ${roadmap.name}.`,
      text:'Your Roadmap is ready whenever you want to add another contribution.',
      label:'Open Roadmap',
      action:'contribution'
    };
  }

  return{
    title:'Build your first weekly reference point.',
    text:'A Weekly Check-in gives WealthOS something broader than one day to remember.',
    label:'Weekly Check-in',
    action:'weekly'
  };
}

function performWorkspaceAction(action){
  if(action==='quickAdd'){openRecordModal('expense');return}
  if(action==='weekly'||action==='monthly'){openCheckin(action);return}
  if(action==='contribution'){openContribution();return}
  if(action==='timeline'){location.hash='timeline';return}
  if(action==='lesson'){location.hash='lesson';return}
  location.hash='spendingSnapshot';
}

function renderWorkspaceActivity(data,fmt){
  const list=$('workspaceActivityList');
  list.innerHTML='';
  const records=expensesForPeriod(data,'daily').slice(0,4);

  if(!records.length){
    const empty=document.createElement('p');
    empty.className='workspace-empty';
    empty.textContent='Nothing recorded today yet. Quick Add is ready when something happens.';
    list.append(empty);
    return;
  }

  records.forEach(item=>{
    const row=document.createElement('article');
    row.className='workspace-activity-item';
    row.innerHTML=`
      <span class="workspace-activity-mark">${categoryInitial(item.category)}</span>
      <div>
        <strong>${item.merchant||item.category}</strong>
        <small>${item.category}</small>
      </div>
      <strong class="workspace-activity-amount">${fmt.format(n(item.amount))}</strong>
    `;
    list.append(row);
  });
}


function performObservationAction(action){
  if(!action)return;
  if(action.kind==='snapshot'){
    location.hash='spendingSnapshot';
    setTimeout(()=>{
      const button=document.querySelector(`.period-button[data-period="${action.period||'monthly'}"]`);
      button?.click();
    },80);
    return;
  }
  if(action.kind==='library'){
    location.hash='recordLibrary';
    return;
  }
  if(action.kind==='library-recurring'){
    location.hash='recordLibrary';
    setTimeout(()=>setRecurringQuickFilter(true),80);
    return;
  }
  if(action.kind==='library-income'){
    location.hash='recordLibrary';
    setTimeout(()=>{
      $('libraryType').value='income';
      renderRecordLibrary(loadData());
    },80);
    return;
  }
  if(action.kind==='record'){
    location.hash='recordLibrary';
    setTimeout(()=>openRecordDetail(action.type,action.id),100);
    return;
  }
  if(action.kind==='record-expense'){
    openRecordModal('expense');
    return;
  }
  if(action.kind==='roadmap'){
    location.hash='roadmaps';
    return;
  }
}

function observationWitSafe(observation,period){
  if(seriousObservation(observation))return '';
  return observationWit(observation,period);
}

function renderSupportingObservations(observations){
  const holder=$('supportingObservationList');
  holder.innerHTML='';
  const supporting=observations.slice(1,4);
  $('supportingObservationCount').textContent=`${supporting.length} additional observation${supporting.length===1?'':'s'}`;
  if(!supporting.length){
    holder.innerHTML='<p class="workspace-empty">No additional observation is strong enough to surface yet.</p>';
    return;
  }
  supporting.forEach(observation=>{
    const row=document.createElement('article');
    row.className='supporting-observation';
    row.innerHTML=`
      <span class="supporting-observation-mark">${observationConfidenceLabel(observation).slice(0,2).toUpperCase()}</span>
      <div>
        <strong>${observation.title}</strong>
        <p>${observation.summary}</p>
      </div>
    `;
    holder.append(row);
  });
}

function renderWorkspaceObservation(data,fmt){
  const observations=generateObservations(data,fmt,'daily');
  const observation=observations[0];

  $('workspaceObservationTitle').textContent=observation.title;
  $('workspaceObservationSummary').textContent=observation.summary;
  $('workspaceObservationWit').textContent=observationWitSafe(observation,'daily');

  const confidence=observationConfidenceLabel(observation);
  $('workspaceObservationConfidence').textContent=confidence;
  $('workspaceObservationConfidence').dataset.level=seriousObservation(observation)?'serious':observation.type;
  $('workspaceObservationPeriod').textContent=observation.period;
  $('workspaceObservationSource').textContent=observation.source;
  $('workspaceObservationMeaning').textContent=observation.meaning;
  $('workspaceObservationEvidence').innerHTML=observation.evidence.map(item=>`<li>${item}</li>`).join('');

  $('workspaceObservation').classList.toggle('severity-serious',seriousObservation(observation));

  const actionArea=$('workspaceObservationAction');
  const actionButton=$('workspaceObservationActionButton');
  actionArea.hidden=!observation.action;
  if(observation.action){
    actionButton.textContent=`${observation.action.label} →`;
    actionButton.onclick=()=>performObservationAction(observation.action);
  }else{
    actionButton.onclick=null;
  }

  renderSupportingObservations(observations);
}

function renderWorkspace(data,fmt){
  const focus=chooseWorkspaceFocus(data);
  $('workspaceFocusTitle').textContent=focus.title;
  $('workspaceFocusText').textContent=focus.text;
  $('workspaceFocusAside').textContent=WEALTHOS_VOICE.focus[focus.action]||WEALTHOS_VOICE.focus.snapshot;
  $('workspaceFocusAction').innerHTML=`${focus.label} <b>→</b>`;
  $('workspaceFocusAction').dataset.action=focus.action;
  $('workspaceFocusTime').textContent=focus.time;

  const todayRecords=expensesForPeriod(data,'daily');
  const roadmap=primaryRoadmap(data);
  $('workspaceIncome').textContent=fmt.format(n(data.income.current));
  $('workspaceIncomeSource').textContent=data.income.source||'Total income';
  $('workspaceIncomeDate').textContent=formatMonth(data.income.currentMonth)||'Current month';
  $('workspaceSpentToday').textContent=fmt.format(expenseTotal(todayRecords));
  $('workspaceReceiptCount').textContent=`${todayRecords.length} record${todayRecords.length===1?'':'s'}`;
  const saved=roadmap?n(roadmap.saved):n(data.emergency.balance);
  $('workspaceSaved').textContent=fmt.format(saved);
  $('workspaceSavedLabel').textContent=roadmap?'Saved toward Roadmap':'Emergency savings';
  $('workspaceRoadmapName').textContent=roadmap?.name||'Future fund';
  $('workspaceRoadmapProgress').textContent=roadmap&&n(roadmap.target)>0?`${Math.min(100,Math.round(n(roadmap.saved)/n(roadmap.target)*100))}% complete`:'No Roadmap yet';
  $('paycheckAside').textContent=deterministicPick(WEALTHOS_VOICE.documents.paycheck,data.income.currentMonth||localDateKey());
  $('receiptAside').textContent=deterministicPick(WEALTHOS_VOICE.documents.receipt,`${todayRecords.length}-${localDateKey()}`);
  $('envelopeAside').textContent=deterministicPick(WEALTHOS_VOICE.documents.envelope,roadmap?.id||'none');

  renderWorkspaceActivity(data,fmt);
  renderRoadmaps(data,fmt);
  renderFinancialMemory(data);

  renderWorkspaceObservation(data,fmt);

  const continuation=chooseWorkspaceContinue(data);
  $('workspaceContinueTitle').textContent=continuation.title;
  $('workspaceContinueText').textContent=continuation.text;
  $('workspaceContinueAction').innerHTML=`${continuation.label} <b>→</b>`;
  $('workspaceContinueAction').dataset.action=continuation.action;

  const lesson=lessons[new Date().getDate()%lessons.length];
  $('workspaceLessonCategory').textContent=lesson.category;
  $('workspaceLessonTitle').textContent=lesson.title;
  $('workspaceLessonSummary').textContent=lesson.summary;
}

function render(data){
  data=updateFinancialMemories(data);
  syncLegacyChallenge(data);
  greeting();
  renderLesson();
  const returning=hasMeaningfulData(data);
  showState(returning);
  assembleFinancialDesk();
  if(!returning)return;
  const fmt=money(data.profile.currency),h=sortedHistory(data),s=stats(h),cur=n(s.cur.amount),prev=s.prev?n(s.prev.amount):null,delta=prev===null?null:cur-prev,pct=prev>0?delta/prev*100:null,source=data.income.source||'Income';
  renderWorkspace(data,fmt);
  renderCoreFoundation(data);
  renderRecordLibrary(data);
  renderFinancialLedger(data,fmt);
  renderSavingsEnvelope(data,fmt);
  $('incomeSlipMonth').textContent=formatMonth(data.income.currentMonth);
  $('incomeSlipSource').textContent=source;
  $('incomeSlipAmount').textContent=fmt.format(cur);
  $('incomeSlipDelta').textContent=delta===null?'First record':`${delta>=0?'+':'−'}${fmt.format(Math.abs(delta))}`;
  ['growthCurrency','attentionCurrency','progressCurrency','nextCurrency'].forEach(id=>$(id).textContent=data.profile.currency);
  renderReturnMemory(data);
  $('financialState').textContent=delta===null||delta>=0?'Your financial life is moving in the right direction.':'Your financial life is steady, with room to rebuild momentum.';
  $('attentionState').textContent='Your Focus is ready.';
  $('todayDate').textContent=new Intl.DateTimeFormat(undefined,{weekday:'long',month:'long',day:'numeric'}).format(new Date());

  $('growthValue').textContent=fmt.format(cur);
  $('growthTitle').textContent=s.isRecord?`${source} reached a new monthly high`:delta>0?`${source} increased this month`:delta<0?`${source} decreased this month`:`${source} held steady this month`;
  $('growthChange').textContent=pct===null?'Your first recorded month':`${delta>=0?'+':''}${pct.toFixed(0)}% · ${delta>=0?'+':'−'}${fmt.format(Math.abs(delta))} vs last month`;
  $('growthPersonal').textContent=s.isRecord?`This is your strongest ${source.toLowerCase()} month since you started WealthOS.`:delta===null?'This is the first chapter in your Timeline.':`Your ${source.toLowerCase()} is ${fmt.format(Math.abs(delta))} ${delta>=0?'higher':'lower'} than last month.`;
  $('growthStoryChanged').textContent=s.prev?`${source} moved from ${fmt.format(prev)} to ${fmt.format(cur)}.`:`You recorded ${fmt.format(cur)} for ${formatMonth(data.income.currentMonth)}.`;
  $('growthStoryMatters').textContent=s.isRecord?'This establishes a new reference point for future progress.':`Your recorded monthly average is ${fmt.format(s.avg)}.`;
  $('growthStoryNext').textContent='Keep checking in so WealthOS can distinguish a pattern from a single month.';
  $('growthSource').textContent='Source: Monthly Check-ins · WealthOS calculates the comparison.';

  const td=daysUntil(data.taxes.dueDate),te=n(data.taxes.estimate),tr=n(data.taxes.reserved),short=Math.max(0,te-tr),funded=te>0&&tr>=te;
  const taxPct=te>0?Math.min(100,tr/te*100):0;
  $('obligationStatus').textContent=te===0?'Not added':funded?'Fully reserved':`${taxPct.toFixed(0)}% reserved`;
  $('obligationEstimate').textContent=te>0?fmt.format(te):'—';
  $('obligationReserved').textContent=te>0?fmt.format(tr):'—';
  $('obligationFill').style.width=`${taxPct}%`;
  $('attentionHorizon').textContent=td===null?'No date':td<0?'Past due':'Time horizon';
  $('attentionTitle').textContent=te===0?'Add tax details when they become relevant':funded?'Your quarterly tax payment is fully reserved':'Your quarterly tax reserve has room to grow';
  $('attentionValue').textContent=te===0?'Ready when you are':td===null?'Date not added':td<0?`${Math.abs(td)} days late`:`${td} days`;
  $('attentionChange').textContent=te===0?'WealthOS will help you prepare':funded?`${fmt.format(tr)} reserved`:`${fmt.format(short)} remaining`;
  $('attentionPersonal').textContent=te===0?'You can add an estimate and due date whenever this becomes part of your financial life.':funded?'You have set aside the full estimated amount.':'Your reserve is still building.';
  $('attentionStoryChanged').textContent=te===0?'No tax estimate has been added yet.':`Your current estimate is ${fmt.format(te)}.`;
  $('attentionStoryMatters').textContent=funded?'The payment should not interrupt your normal cash flow.':'This can become part of your Focus when you are ready.';
  $('attentionStoryNext').textContent=te===0?'Add details only when taxes become relevant to you.':funded?'Keep the reserve untouched until the payment clears.':'Update the estimate or reserve.';
  $('attentionSource').textContent='Source: Tax details in About You · WealthOS calculates timing and coverage.';
  $('attentionAction').textContent=te===0?'Add tax details':'Update tax reserve';

  const eb=n(data.emergency.balance),ess=n(data.emergency.essentials),tm=n(data.emergency.targetMonths,6),months=ess>0?eb/ess:0,target=ess*tm,remaining=Math.max(0,target-eb),complete=ess>0&&eb>=target;
  if(data.challenge.enabled&&n(data.challenge.target)>0){
    const savedForObject=n(data.challenge.saved),targetForObject=n(data.challenge.target);
    const pctForObject=targetForObject>0?Math.min(100,Math.round(savedForObject/targetForObject*100)):0;
    $('goalRing').style.setProperty('--progress',`${pctForObject*3.6}deg`);
    $('goalPercent').textContent=`${pctForObject}%`;
    $('goalLabel').textContent=data.challenge.name||'Savings goal';
    $('goalRemaining').textContent=pctForObject>=100?'Goal complete':`${fmt.format(Math.max(0,targetForObject-savedForObject))} remaining`;
    $('goalSubcopy').textContent=savedForObject===0?'Record your first contribution to begin.':'Each contribution becomes part of your Timeline.';
    const saved=n(data.challenge.saved),targetC=n(data.challenge.target),rem=Math.max(0,targetC-saved),per=Math.min(100,Math.round(saved/targetC*100));
    $('progressTitle').textContent=rem===0?`Your ${data.challenge.name} challenge is complete`:saved===0?`Your ${data.challenge.name} challenge is ready to begin`:`Your ${data.challenge.name} challenge is moving forward`;
    $('progressValue').textContent=fmt.format(saved);
    $('progressChange').textContent=`${per}% of ${fmt.format(targetC)} saved`;
    $('progressPersonal').textContent=rem===0?'You reached the full target you set for yourself.':saved===0?'Your first contribution will begin this chapter.':`${fmt.format(rem)} remains.`;
    $('progressSource').textContent='Source: Savings Challenge and recorded contributions.';
    $('progressAction').textContent=rem===0?'Update goal':saved===0?'Record first contribution':'Record contribution';
  }else{
    const emergencyPct=target>0?Math.min(100,Math.round(eb/target*100)):0;
    $('goalRing').style.setProperty('--progress',`${emergencyPct*3.6}deg`);
    $('goalPercent').textContent=`${emergencyPct}%`;
    $('goalLabel').textContent='Emergency fund';
    $('goalRemaining').textContent=target>0?`${fmt.format(Math.max(0,target-eb))} remaining`:'Ready when you are';
    $('goalSubcopy').textContent=ess>0?'Measured against your selected coverage target.':'Add monthly essentials to calculate coverage.';
    $('progressTitle').textContent=complete?'Your emergency fund is complete':ess>0?'Your emergency fund is still building':'Set an emergency-fund target when you are ready';
    $('progressValue').textContent=ess>0?fmt.format(eb):'Ready when you are';
    $('progressChange').textContent=ess>0?`${months.toFixed(1)} months covered`:'Add monthly essentials';
    $('progressPersonal').textContent=complete?`You reached your ${tm}-month target.`:ess>0?`${fmt.format(remaining)} remains before your target.`:'WealthOS can calculate coverage once you add your essential expenses.';
    $('progressSource').textContent='Source: Emergency-fund balance, essential expenses, and target.';
    $('progressAction').textContent=ess>0?'Update emergency fund':'Set emergency-fund target';
  }
  $('progressStoryChanged').textContent='This moment reflects the progress currently saved in WealthOS.';

  let next;
  if(te>0&&short>0&&td!==null&&td<=30)next={t:'Continue building your tax reserve',v:fmt.format(short),c:'Worth reviewing',p:'This is the clearest current priority.'};
  else if(ess>0&&!complete)next={t:'Continue building your emergency fund',v:fmt.format(Math.min(remaining,n(data.emergency.monthlyContribution)||remaining)),c:`${months.toFixed(1)} of ${tm} months covered`,p:'Your emergency fund remains a strong next foundation.'};
  else if(data.challenge.enabled&&n(data.challenge.target)>n(data.challenge.saved))next={t:`Continue your ${data.challenge.name} challenge`,v:fmt.format(n(data.challenge.target)-n(data.challenge.saved)),c:'Remaining goal',p:'Your next contribution keeps the challenge moving.'};
  else next={t:'No financial action is required today',v:'On track',c:'Review when something changes',p:'Your current information does not require an immediate step.'};
  $('nextActionPreview').textContent=next.t;
  $('nextTitle').textContent=next.t;$('nextValue').textContent=next.v;$('nextChange').textContent=next.c;$('nextPersonal').textContent=next.p;$('nextStoryWhy').textContent=next.p;$('nextStoryChanges').textContent='This recommendation is based only on the information you chose to add.';$('nextStoryMove').textContent='Complete the linked action or update your information when priorities change.';
  $('nextSource').textContent='Source: Growth, Attention, and Progress Signals · WealthOS selects one priority.';
  $('nextAction').textContent=te>0&&short>0?'Update tax reserve':ess>0&&!complete?'Update emergency fund':data.challenge.enabled&&n(data.challenge.target)>n(data.challenge.saved)?'Record contribution':'Review About You';
  renderTimeline(data,h,fmt,source);
  renderSnapshot(data,fmt,expensesForPeriod(data,'daily').length?'daily':'weekly');
  populateAbout(data);
}
function timelineEvent(title,description,amount,isFresh=false){
  const a=document.createElement('article');a.className='timeline-event';
  if(isFresh)a.classList.add('loop-added');
  const b=document.createElement('button');b.className='timeline-event-button';b.type='button';b.setAttribute('aria-expanded','false');
  const marker=document.createElement('span');marker.className='timeline-marker';
  const copy=document.createElement('div');copy.className='timeline-copy';copy.innerHTML=`<h4>${title}</h4><p>${description}</p><span class="story-tone">Reflection</span>`;
  const val=document.createElement('div');val.className='timeline-amount';val.textContent=amount;
  const action=document.createElement('span');action.className='timeline-event-action';action.innerHTML='<span>Read story</span><b>+</b>';
  b.append(marker,copy,val,action);
  const story=document.createElement('div');story.className='timeline-story';story.innerHTML=`<div class="timeline-story-inner"><div class="timeline-story-block"><span>What happened</span><p>${description}</p></div><div class="timeline-story-block"><span>Why it matters</span><p>This chapter becomes part of the context WealthOS uses to help you understand future changes.</p></div></div>`;
  a.append(b,story);b.onclick=()=>{const open=a.classList.toggle('open');b.setAttribute('aria-expanded',String(open))};return a;
}



const WEALTHOS_VOICE={
  focus:{
    quickAdd:'No spreadsheet ceremony required.',
    weekly:'One week is a clue. A few weeks become a pattern.',
    monthly:'Close the month. Keep the drama out of it.',
    contribution:'Future you has excellent taste.',
    snapshot:'The numbers are ready. No calculator face required.'
  },

  documents:{
    paycheck:[
      'Money came in. We noticed.',
      'The plot has income.',
      'A very welcome character.'
    ],
    receipt:[
      'Today left a paper trail.',
      'Tiny records. Better context.',
      'Receipts: less glamorous, very useful.'
    ],
    envelope:[
      'Future you says thanks.',
      'Assigned to something that matters.',
      'Not gone. Just given a job.'
    ]
  },

  category:{
    Coffee:[
      'Coffee is not a moral failing. It is, however, very trackable.',
      'Caffeine happened. Context followed.',
      'A small cup can still leave a pattern.'
    ],
    'Food & Dining':[
      'Dinner has entered the chat.',
      'One meal is a moment. Repetition becomes a pattern.',
      'No food shaming here. Just useful context.'
    ],
    Groceries:[
      'One receipt. Several future meals.',
      'Groceries often look bigger because they work overtime.',
      'This purchase may feed more than one day.'
    ],
    Transportation:[
      'Getting somewhere also costs something.',
      'Movement has a price tag. Now it has context.',
      'The destination was not the only thing that moved.'
    ],
    Housing:[
      'The roof is doing a lot of financial heavy lifting.',
      'Housing: essential, substantial, and rarely shy.',
      'A fixed expense with main-character energy.'
    ],
    Utilities:[
      'The lights stayed on. The bill showed up.',
      'Useful, recurring, and not especially mysterious.',
      'Modern life sent another invoice.'
    ],
    Shopping:[
      'The bag is cute. The context is useful.',
      'A purchase can be fun and still deserve perspective.',
      'Retail therapy has now met recordkeeping.'
    ],
    Health:[
      'Health spending is rarely the fun kind. It still deserves clarity.',
      'Taking care of yourself counts as financial activity too.',
      'Necessary does not always mean predictable.'
    ],
    Entertainment:[
      'Fun has a line item. That is allowed.',
      'Enjoyment is part of a financial life too.',
      'Not every dollar needs a serious face.'
    ],
    Travel:[
      'Future memories often start as present-day expenses.',
      'The trip is temporary. The planning is doing the work.',
      'A boarding pass is just a Roadmap with better views.'
    ],
    Subscriptions:[
      'Small monthly charges love becoming annual totals.',
      'A tiny recurring charge can have impressive stamina.',
      'Subscriptions are quiet. Their totals are less quiet.'
    ],
    Taxes:[
      'Taxes: rarely delightful, frequently relevant.',
      'The money did not vanish. It had an assignment.',
      'Not glamorous. Very much part of the story.'
    ],
    Debt:[
      'Debt gets less mysterious when principal and interest stop hiding together.',
      'Borrowed money comes with a supporting character named interest.',
      'Every payment has two jobs: cost and progress.'
    ],
    Insurance:[
      'Paying for protection is not exciting. That is often the point.',
      'A boring premium can protect against a very un-boring bill.',
      'Risk management rarely gets invited to parties.'
    ],
    Investment:[
      'Growth likes time. It also dislikes guarantees.',
      'Investing is patience wearing a little risk.',
      'The future is uncertain. Diversification knows.'
    ],
    Other:[
      'Every category starts somewhere.',
      'Uncategorized does not mean unimportant.',
      'Mystery expense, meet context.'
    ]
  },

  observation:{
    limited:'Not a trend yet. Just a very well-documented moment.',
    steady:'Steady is not boring. Steady is information.',
    increase:'Higher does not automatically mean worse. Context first.',
    decrease:'Lower is a change, not automatically a victory.',
    daily:'Today is one page, not the whole book.',
    weekly:'A week is useful. A pattern needs company.'
  }
};

function deterministicPick(items,key=''){
  if(!Array.isArray(items)||!items.length)return '';
  const score=String(key).split('').reduce((sum,char)=>sum+char.charCodeAt(0),0);
  return items[score%items.length];
}

function voiceForCategory(category,key=''){
  return deterministicPick(
    WEALTHOS_VOICE.category[category]||WEALTHOS_VOICE.category.Other,
    `${category}-${key}`
  );
}

function observationWit(observation,period){
  const title=String(observation?.title||'').toLowerCase();
  if(title.includes('clearer pattern'))return WEALTHOS_VOICE.observation.limited;
  if(title.includes('steady'))return WEALTHOS_VOICE.observation.steady;
  if(title.includes('increased'))return WEALTHOS_VOICE.observation.increase;
  if(title.includes('decreased'))return WEALTHOS_VOICE.observation.decrease;
  return period==='daily'?WEALTHOS_VOICE.observation.daily:period==='weekly'?WEALTHOS_VOICE.observation.weekly:WEALTHOS_VOICE.observation.limited;
}

const CONTEXT_LIBRARY={
  expense:{
    Coffee:{
      concept:'Discretionary spending',
      explanation:'Coffee is usually discretionary spending: optional spending rather than a fixed obligation such as rent or insurance.',
      aliases:['cafe','espresso','latte','tea']
    },
    'Food & Dining':{
      concept:'Variable expenses',
      explanation:'Dining is generally a variable expense, which means its total can change more easily than a fixed cost such as housing.',
      aliases:['restaurant','takeout','delivery','doordash','lunch','dinner']
    },
    Groceries:{
      concept:'Essential but variable',
      explanation:'Groceries are usually essential spending, but the amount can still vary with household size, location, and shopping habits.',
      aliases:['supermarket','market','food store']
    },
    Transportation:{
      concept:'Mixed expenses',
      explanation:'Transportation may combine fixed costs, such as a car payment, with variable costs, such as fuel, fares, and rides.',
      aliases:['gas','uber','lyft','train','bus','parking']
    },
    Housing:{
      concept:'Fixed expenses',
      explanation:'Housing is often a household’s largest fixed expense. Because it is difficult to change quickly, it strongly shapes monthly cash flow.',
      aliases:['rent','mortgage','hoa']
    },
    Utilities:{
      concept:'Recurring obligations',
      explanation:'Utilities are recurring obligations, but some portions may vary with usage, season, and local rates.',
      aliases:['electricity','water','internet','phone','gas bill']
    },
    Shopping:{
      concept:'Discretionary or necessary',
      explanation:'Shopping is commonly discretionary unless the purchase was necessary for work, health, or daily living. Context determines the category.',
      aliases:['clothes','shoes','retail']
    },
    Health:{
      concept:'Predictable and unpredictable costs',
      explanation:'Health spending can include predictable costs, such as premiums, and less predictable costs, such as deductibles or urgent care.',
      aliases:['doctor','pharmacy','medicine','medical']
    },
    Entertainment:{
      concept:'Discretionary spending',
      explanation:'Entertainment is discretionary spending. That does not make it bad; it means the amount can be adjusted when priorities change.',
      aliases:['movie','concert','games']
    },
    Travel:{
      concept:'Sinking funds',
      explanation:'A sinking fund can spread a future travel cost across smaller contributions instead of placing the full expense in one month.',
      aliases:['flight','hotel','vacation','trip']
    },
    Subscriptions:{
      concept:'Recurring expenses',
      explanation:'Subscriptions are recurring expenses. Their individual amounts may look small, but repeated charges accumulate across a year.',
      aliases:['netflix','spotify','membership','software']
    },
    Taxes:{
      concept:'Tax payments',
      explanation:'Taxes may be withheld from pay, paid through estimated installments, or settled when a return is filed, depending on income and local rules.',
      aliases:['irs','withholding','estimated tax','income tax']
    },
    Debt:{
      concept:'Principal and interest',
      explanation:'A debt payment can include both principal, which reduces the amount owed, and interest, which is the cost of borrowing.',
      aliases:['credit card','loan','minimum payment']
    },
    Insurance:{
      concept:'Risk transfer',
      explanation:'Insurance exchanges a predictable premium for protection against certain larger, less predictable financial losses.',
      aliases:['premium','deductible','coverage']
    },
    Investment:{
      concept:'Risk and return',
      explanation:'Investing accepts uncertainty in pursuit of future growth. Returns are not guaranteed, and time horizon affects how much volatility a person may be able to tolerate.',
      aliases:['stocks','index fund','brokerage','401k','ira']
    },
    Other:{
      concept:'Financial categorization',
      explanation:'Categorizing a purchase helps WealthOS compare similar spending over time and explain where money is going.',
      aliases:[]
    }
  },

  checkin:{
    weekly:{
      concept:'Reference point versus pattern',
      explanation:'A weekly spending total is a short-term reference point. Several weekly records are needed before WealthOS can distinguish a one-time event from a recurring pattern.'
    },
    monthlySaving:{
      concept:'Saving within cash flow',
      explanation:'Saving redirects part of current cash flow toward a future purpose. Repeated contributions make progress easier to measure.'
    },
    monthlyNegative:{
      concept:'Negative cash flow',
      explanation:'When recorded spending exceeds income, monthly cash flow is negative. One month does not define financial health, but the difference is worth understanding.'
    },
    monthly:{
      concept:'Cash flow',
      explanation:'A monthly check-in compares money coming in with money going out. That relationship is the foundation of cash-flow planning.'
    }
  },

  savings:{
    contribution:{
      concept:'Consistent contributions',
      explanation:'A contribution turns a future goal into measurable progress. Consistency often matters more than making every contribution large.'
    },
    emergency:{
      concept:'Liquidity',
      explanation:'Emergency savings are designed to remain accessible. Their purpose is to create options when an essential cost or income disruption appears.'
    }
  },

  income:{
    paycheck:{
      concept:'Gross versus net income',
      explanation:'Gross income is earned before deductions. Net income is the amount received after taxes, benefits, and other deductions.'
    }
  }
};

function normalizeContextText(value){
  return String(value||'').trim().toLowerCase();
}

function expenseContextEntry(expense){
  const category=expense.category||'Other';
  let resolvedCategory=category;
  let entry=CONTEXT_LIBRARY.expense[category]||null;

  if(!entry){
    const haystack=normalizeContextText(`${expense.merchant||''} ${expense.note||''} ${category}`);
    for(const [name,candidate] of Object.entries(CONTEXT_LIBRARY.expense)){
      if((candidate.aliases||[]).some(alias=>haystack.includes(normalizeContextText(alias)))){
        entry=candidate;
        resolvedCategory=name;
        break;
      }
    }
  }

  entry=entry||CONTEXT_LIBRARY.expense.Other;
  return{
    ...entry,
    wit:voiceForCategory(resolvedCategory,`${expense.merchant||''}-${expense.date||''}`)
  };
}

function contextForExpense(expense){
  return expenseContextEntry(expense);
}

function contextForCheckin(type,data){
  if(type==='weekly')return{...CONTEXT_LIBRARY.checkin.weekly,wit:'One week is useful. A pattern needs company.'};

  const latest=(data.checkins||[]).at(-1)||{};
  const income=n(latest.income);
  const spent=n(latest.spent);
  const saved=n(latest.saved);

  if(saved>0)return{...CONTEXT_LIBRARY.checkin.monthlySaving,wit:'Future you has excellent taste.'};
  if(income>0&&spent>income)return{...CONTEXT_LIBRARY.checkin.monthlyNegative,wit:'No panic. Just a number worth understanding.'};
  return{...CONTEXT_LIBRARY.checkin.monthly,wit:'Cash flow: less glamorous than cash, more useful than flow charts.'};
}

function localDateKey(date=new Date()){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`}
function startOfWeek(date=new Date()){const result=new Date(date);result.setHours(0,0,0,0);const day=result.getDay(),offset=day===0?6:day-1;result.setDate(result.getDate()-offset);return result}
function expensesForPeriod(data,period){
  const expenses=activeOnly(data.expenses),today=new Date();today.setHours(0,0,0,0);
  const todayKey=localDateKey(today),weekStart=startOfWeek(today),monthKey=todayKey.slice(0,7);
  return expenses.filter(item=>{const date=new Date(`${item.date}T12:00:00`);if(period==='daily')return item.date===todayKey;if(period==='weekly')return date>=weekStart&&date<=new Date(`${todayKey}T23:59:59`);return item.date.slice(0,7)===monthKey})
    .sort((a,b)=>String(b.date).localeCompare(String(a.date))||n(b.id)-n(a.id));
}
function expenseTotal(items){return items.reduce((sum,item)=>sum+n(item.amount),0)}
function spendingSource(data,period){
  const records=expensesForPeriod(data,period);
  if(records.length){const newest=records[0];return{type:'expenses',amount:expenseTotal(records),records,text:`Based on ${records.length} Quick Add record${records.length===1?'':'s'} · Updated ${formatDate(newest.date)}`}}
  const amount=n(data.spending?.[period]);
  const latest=[...(data.checkins||[])].filter(item=>item.type===period).sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
  return{type:'manual',amount,records:[],text:latest?`Based on your latest ${period} check-in · Updated ${formatDate(latest.date)}`:`No ${period} spending recorded yet`}
}
function categoryInitial(category){return String(category||'Other').split(/\s+/).filter(Boolean).slice(0,2).map(word=>word[0]).join('').toUpperCase()}
function renderRecentReceipts(data,period,fmt){
  const list=$('recentReceiptsList');list.innerHTML='';const records=expensesForPeriod(data,period).slice(0,6);
  $('recentReceiptsTitle').textContent=period==='daily'?'Today’s receipts':period==='weekly'?'This week’s records':'This month’s records';
  if(!records.length){const empty=document.createElement('p');empty.className='receipt-record-empty';empty.textContent=period==='daily'?'No purchases recorded today yet.':`No individual purchases recorded for this ${period==='weekly'?'week':'month'} yet.`;list.append(empty);return}
  records.forEach(item=>{const row=document.createElement('article');row.className='receipt-record';const merchant=item.merchant||item.category;row.innerHTML=`<span class="receipt-category-mark">${categoryInitial(item.category)}</span><div class="receipt-record-copy"><strong>${merchant}</strong><span>${item.category} · ${formatDate(item.date)}</span></div><strong class="receipt-record-amount">${fmt.format(n(item.amount))}</strong>`;list.append(row)})
}
function openQuickAdd(){
  const data=loadData();if(!hasMeaningfulData(data)){openOnboarding();return}
  $('quickAddAmount').value='';$('quickAddDate').value=localDateKey();$('quickAddCategory').value='Coffee';$('quickAddMerchant').value='';$('quickAddNote').value='';
  $('quickAddModal').classList.add('open');$('quickAddModal').setAttribute('aria-hidden','false');setTimeout(()=>$('quickAddAmount').focus(),80)
}
function closeQuickAdd(){$('quickAddModal').classList.remove('open');$('quickAddModal').setAttribute('aria-hidden','true')}
let expenseToastTimer=null;
function showExpenseToast(expense,data){
  const fmt=money(data.profile.currency);
  $('expenseToastTitle').textContent=`${expense.category} recorded.`;
  $('expenseToastText').textContent=`${fmt.format(expense.amount)} was added to today, this week, and this month.`;
  const context=contextForExpense(expense);
  $('expenseContextTitle').textContent=context.concept;
  $('expenseContextText').textContent=context.explanation;
  $('expenseContextWit').textContent=context.wit||'';
  $('expenseToast').classList.add('show');
  clearTimeout(expenseToastTimer);
  expenseToastTimer=setTimeout(()=>$('expenseToast').classList.remove('show'),9000);
}
function saveQuickAdd(event){
  event.preventDefault();const amount=Math.max(0,n($('quickAddAmount').value));if(amount<=0)return;
  const data=loadData(),expense={id:Date.now(),amount,category:$('quickAddCategory').value||'Other',merchant:$('quickAddMerchant').value.trim(),note:$('quickAddNote').value.trim(),date:$('quickAddDate').value||localDateKey()};
  data.expenses.push(expense);data.memory={...(data.memory||{}),lastInteraction:'expense',lastCheckinType:null,lastCheckinDate:expense.date,lastSummary:`You recorded ${money(data.profile.currency).format(amount)} for ${expense.category}.`};
  saveData(data);closeQuickAdd();render(data);showExpenseToast(expense,data)
}
function renderTimeline(data,h,fmt,source){
  const groups=$('timelineGroups');groups.innerHTML='';
  const rev=[...h].reverse();$('timelineSummary').textContent=`${rev.length} chapter${rev.length===1?'':'s'} remembered.`;
  rev.forEach((x,i)=>{
    const prev=h[h.findIndex(y=>y.month===x.month)-1],diff=prev?x.amount-prev.amount:null;
    const month=document.createElement('section');month.className='timeline-month';month.dataset.month=x.month;
    const heading=document.createElement('div');heading.className='timeline-month-heading';heading.innerHTML=`<h3>${formatMonth(x.month)}</h3><p>1 chapter</p>`;
    const events=document.createElement('div');events.className='timeline-events';
    const title=i===0&&stats(h).isRecord?`${source} reached a new monthly high`:diff===null?'Your first chapter began':diff>0?`${source} moved forward`:diff<0?`${source} softened`:`${source} remained steady`;
    const desc=diff===null?`You recorded your first ${source.toLowerCase()} check-in.`:`Your ${source.toLowerCase()} changed by ${fmt.format(Math.abs(diff))} from the prior month.`;
    events.append(timelineEvent(title,desc,fmt.format(x.amount)));month.append(heading,events);groups.append(month);
  });

  const checkins=[...(data.checkins||[])].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  checkins.slice(0,8).forEach(checkin=>{
    const monthKey=String(checkin.date||'').slice(0,7);
    let monthSection=[...groups.querySelectorAll('.timeline-month')].find(section=>section.dataset.month===monthKey);
    if(!monthSection){
      monthSection=document.createElement('section');monthSection.className='timeline-month';monthSection.dataset.month=monthKey;
      const heading=document.createElement('div');heading.className='timeline-month-heading';heading.innerHTML=`<h3>${formatMonth(monthKey)}</h3><p>Check-in</p>`;
      const events=document.createElement('div');events.className='timeline-events';monthSection.append(heading,events);groups.prepend(monthSection);
    }
    const events=monthSection.querySelector('.timeline-events');
    const isWeekly=checkin.type==='weekly';
    const title=isWeekly?'Weekly check-in completed':'Monthly check-in completed';
    const amount=isWeekly?fmt.format(n(checkin.spent)):fmt.format(n(checkin.spent));
    const description=isWeekly
      ? `You reflected on approximately ${fmt.format(n(checkin.spent))} of spending this week.`
      : `You closed the month with ${fmt.format(n(checkin.income))} of income and ${fmt.format(n(checkin.spent))} of spending.`;
    events.append(timelineEvent(title,description,amount,Boolean(checkin.isFresh)));
  });
  const recentExpenses=[...activeOnly(data.expenses)].sort((a,b)=>String(b.date).localeCompare(String(a.date))||n(b.id)-n(a.id)).slice(0,8),expenseGroups=new Map();
  recentExpenses.forEach(expense=>{if(!expenseGroups.has(expense.date))expenseGroups.set(expense.date,[]);expenseGroups.get(expense.date).push(expense)});
  expenseGroups.forEach((items,date)=>{
    const monthKey=date.slice(0,7);let monthSection=[...groups.querySelectorAll('.timeline-month')].find(section=>section.dataset.month===monthKey);
    if(!monthSection){monthSection=document.createElement('section');monthSection.className='timeline-month';monthSection.dataset.month=monthKey;const heading=document.createElement('div');heading.className='timeline-month-heading';heading.innerHTML=`<h3>${formatMonth(monthKey)}</h3><p>Purchases</p>`;const events=document.createElement('div');events.className='timeline-events';monthSection.append(heading,events);groups.prepend(monthSection)}
    const total=expenseTotal(items),categories=[...new Set(items.map(item=>item.category))],title=items.length===1?`${items[0].category} purchase recorded`:`${items.length} purchases recorded`,description=items.length===1?`${items[0].merchant||items[0].category} was added through Quick Add.`:`${categories.slice(0,3).join(', ')}${categories.length>3?' and more':''} became part of this day’s record.`;
    monthSection.querySelector('.timeline-events').append(timelineEvent(title,description,fmt.format(total)));
  });

}

function previousMonthKey(date=new Date()){
  const d=new Date(date.getFullYear(),date.getMonth()-1,1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function currentMonthKey(date=new Date()){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
}

function categoryTotalsForMonth(data,monthKey){
  const totals=new Map();
  activeOnly(data.expenses)
    .filter(item=>String(item.date).slice(0,7)===monthKey)
    .forEach(item=>totals.set(item.category,(totals.get(item.category)||0)+n(item.amount)));
  return totals;
}

function strongestCategory(totals){
  return [...totals.entries()].sort((a,b)=>b[1]-a[1])[0]||null;
}


const OBSERVATION_PRIORITY={
  overdue:100,
  cashflow:95,
  upcoming:90,
  duplicate:85,
  stale:80,
  roadmap:70,
  comparison:65,
  recurring:60,
  category:50,
  income:45,
  limited:10
};

function observationPeriodLabel(period){
  return {daily:'Today',weekly:'This week',monthly:'This month'}[period]||'Current period';
}

function periodExpenses(data,period){
  return expensesForPeriod(data,period);
}

function previousPeriodExpenses(data,period){
  const today=new Date();
  const records=activeOnly(data.expenses);
  if(period==='daily'){
    const previous=new Date(today);
    previous.setDate(previous.getDate()-1);
    const key=localDateKey(previous);
    return records.filter(item=>item.date===key);
  }
  if(period==='weekly'){
    const currentStart=startOfWeek(today);
    const previousStart=new Date(currentStart);
    previousStart.setDate(previousStart.getDate()-7);
    const previousEnd=new Date(currentStart);
    previousEnd.setMilliseconds(-1);
    return records.filter(item=>{
      const date=new Date(`${item.date}T12:00:00`);
      return date>=previousStart&&date<=previousEnd;
    });
  }
  const key=previousMonthKey(today);
  return records.filter(item=>String(item.date).slice(0,7)===key);
}

function categoryTotals(items){
  const totals=new Map();
  items.forEach(item=>totals.set(item.category||'Other',(totals.get(item.category||'Other')||0)+n(item.amount)));
  return totals;
}

function observationBase({
  id,type='fact',priority=0,severity='normal',title,summary,meaning,
  period='Current period',source='User-reported records',evidence=[],action=null
}){
  return{
    id:String(id||coreId('observation')),
    type,
    priority,
    severity,
    title:String(title||''),
    summary:String(summary||''),
    meaning:String(meaning||''),
    period:String(period||'Current period'),
    source:String(source||'User-reported records'),
    evidence:Array.isArray(evidence)?evidence.map(String):[],
    action,
    generatedAt:new Date().toISOString()
  };
}

function observationConfidenceLabel(observation){
  const labels={
    fact:'Fact',
    comparison:'Comparison',
    emerging:'Emerging pattern',
    established:'Established pattern',
    estimate:'Estimate'
  };
  return labels[observation.type]||'Fact';
}

function seriousObservation(observation){
  return observation?.severity==='serious';
}

function generateObservations(data,fmt,period='daily'){
  const observations=[];
  const current=periodExpenses(data,period);
  const previous=previousPeriodExpenses(data,period);
  const currentTotal=expenseTotal(current);
  const previousTotal=expenseTotal(previous);
  const periodLabel=observationPeriodLabel(period);
  const state=knowledgeState(data);

  // 1. Overdue recurring obligations.
  const today=localDateKey();
  activeOnly(data.recurringBills).forEach(bill=>{
    const recurrence=normalizeRecurrence(bill);
    const due=recurrence.nextExpectedDate||bill.nextDueDate;
    if(due&&due<today){
      observations.push(observationBase({
        id:`overdue-${bill.id}`,
        type:'fact',
        priority:OBSERVATION_PRIORITY.overdue,
        severity:'serious',
        title:`${bill.name} appears past its expected date.`,
        summary:`The recorded expectation was ${formatDate(due)} for ${fmt.format(n(bill.expectedAmount))}.`,
        meaning:'WealthOS only knows the expected date. It does not know whether the bill was paid unless a completed payment is recorded.',
        period:'Current obligations',
        source:'Recurring bill schedule entered by you',
        evidence:[
          `Expected date: ${formatDate(due)}`,
          `Expected amount: ${fmt.format(n(bill.expectedAmount))}`,
          'No matching completed payment was confirmed by this schedule'
        ],
        action:{label:'Review bill',kind:'record',type:'bill',id:bill.id}
      }));
    }
  });

  // 2. Negative recorded cash flow.
  const monthlyIncome=n(data.income?.current);
  const monthlySpending=expenseTotal(expensesForPeriod(data,'monthly'));
  if(monthlyIncome>0&&monthlySpending>monthlyIncome){
    const gap=monthlySpending-monthlyIncome;
    observations.push(observationBase({
      id:'negative-cashflow',
      type:'fact',
      priority:OBSERVATION_PRIORITY.cashflow,
      severity:'serious',
      title:'Recorded spending is currently above recorded monthly income.',
      summary:`Spending exceeds income by ${fmt.format(gap)} based on records entered so far.`,
      meaning:'This is a current recorded difference, not a complete assessment of financial health. Missing income or expenses may change the picture.',
      period:'This month',
      source:'Recorded income and active expense records',
      evidence:[
        `Recorded income: ${fmt.format(monthlyIncome)}`,
        `Recorded spending: ${fmt.format(monthlySpending)}`,
        `Difference: ${fmt.format(gap)}`
      ],
      action:{label:'Review monthly Snapshot',kind:'snapshot',period:'monthly'}
    }));
  }

  // 3. Upcoming recurring activity in the next 14 days.
  const upcoming=expectedRecurringRecords(data,14);
  if(upcoming.length){
    const total=upcoming.reduce((sum,{item})=>sum+recordAmount('bill'===item.type?'bill':'expense',item),0);
    const first=upcoming[0];
    const firstDate=normalizeRecurrence(first.item).nextExpectedDate;
    observations.push(observationBase({
      id:'upcoming-recurring',
      type:'fact',
      priority:OBSERVATION_PRIORITY.upcoming,
      title:`${upcoming.length} recurring item${upcoming.length===1?' is':'s are'} expected soon.`,
      summary:`The next expected item is ${recordTitle(first.type,first.item,data)} on ${formatDate(firstDate)}.`,
      meaning:'These are expectations only. Actual totals will change only when completed activity is recorded.',
      period:'Next 14 days',
      source:'Recurring schedules entered by you',
      evidence:upcoming.slice(0,4).map(({type,item})=>{
        const recurrence=normalizeRecurrence(item);
        return `${recordTitle(type,item,data)} · ${formatDate(recurrence.nextExpectedDate)} · ${fmt.format(recordAmount(type,item))}`;
      }),
      action:{label:'Review upcoming activity',kind:'library-recurring'}
    }));
  }

  // 4. Data quality issues.
  const issues=dataQualityIssues(data);
  if(issues.length){
    const first=issues[0];
    observations.push(observationBase({
      id:`quality-${first.key}`,
      type:'fact',
      priority:OBSERVATION_PRIORITY.duplicate,
      title:first.title,
      summary:first.text,
      meaning:'This is an invitation to review—not a claim that the record is wrong.',
      period:'Record quality',
      source:'Record Library consistency checks',
      evidence:[first.text,`${issues.length} item${issues.length===1?'':'s'} currently worth reviewing`],
      action:{label:'Open Record Library',kind:'library'}
    }));
  }

  // 5. Roadmap pace and milestones.
  const roadmap=primaryRoadmap(data);
  if(roadmap&&n(roadmap.target)>0){
    const progress=Math.min(100,n(roadmap.saved)/n(roadmap.target)*100);
    if(progress>=100){
      observations.push(observationBase({
        id:`roadmap-complete-${roadmap.id}`,
        type:'fact',
        priority:OBSERVATION_PRIORITY.roadmap,
        title:`${roadmap.name} is fully funded.`,
        summary:`You recorded ${fmt.format(roadmap.saved)} against a ${fmt.format(roadmap.target)} target.`,
        meaning:'The Roadmap reached the amount you defined. WealthOS is not making a recommendation about where the money should go next.',
        period:'Roadmap progress',
        source:'Roadmap target and recorded contributions',
        evidence:[
          `Target: ${fmt.format(roadmap.target)}`,
          `Recorded progress: ${fmt.format(roadmap.saved)}`,
          'Progress: 100%'
        ],
        action:{label:'Open Roadmap',kind:'roadmap',id:roadmap.id}
      }));
    }else if(progress>=25){
      observations.push(observationBase({
        id:`roadmap-progress-${roadmap.id}`,
        type:state.daySpan>=30?'established':'fact',
        priority:OBSERVATION_PRIORITY.roadmap,
        title:`${roadmap.name} is ${Math.round(progress)}% complete.`,
        summary:`You have ${fmt.format(Math.max(0,n(roadmap.target)-n(roadmap.saved)))} left to reach the current target.`,
        meaning:'This describes recorded progress only. A pace estimate requires reliable contribution timing.',
        period:'Roadmap progress',
        source:'Roadmap target and recorded contributions',
        evidence:[
          `Saved: ${fmt.format(roadmap.saved)}`,
          `Target: ${fmt.format(roadmap.target)}`,
          `Remaining: ${fmt.format(Math.max(0,n(roadmap.target)-n(roadmap.saved)))}`
        ],
        action:{label:'Open Roadmap',kind:'roadmap',id:roadmap.id}
      }));
    }
  }

  // 6. Period comparison.
  if(current.length&&previous.length&&previousTotal>0){
    const change=(currentTotal-previousTotal)/previousTotal*100;
    const absolute=Math.abs(currentTotal-previousTotal);
    const enough=period==='monthly'||current.length>=3&&previous.length>=3;
    observations.push(observationBase({
      id:`period-comparison-${period}`,
      type:enough?'comparison':'emerging',
      priority:OBSERVATION_PRIORITY.comparison,
      title:Math.abs(change)<5
        ? `Recorded spending is fairly steady compared with the previous ${period}.`
        : `Recorded spending ${change>0?'increased':'decreased'} ${Math.abs(change).toFixed(0)}% from the previous ${period}.`,
      summary:`${fmt.format(currentTotal)} is recorded for ${periodLabel.toLowerCase()}, compared with ${fmt.format(previousTotal)} in the previous comparable period.`,
      meaning:enough
        ? 'This is a direct comparison of two recorded periods.'
        : 'The comparison is mathematically valid, but the number of records is still limited.',
      period:`${periodLabel} vs previous ${period}`,
      source:'Active expense records',
      evidence:[
        `${periodLabel}: ${fmt.format(currentTotal)} across ${current.length} record${current.length===1?'':'s'}`,
        `Previous ${period}: ${fmt.format(previousTotal)} across ${previous.length} record${previous.length===1?'':'s'}`,
        `Difference: ${fmt.format(absolute)}`
      ],
      action:{label:'Review Snapshot',kind:'snapshot',period}
    }));
  }

  // 7. Largest category.
  if(current.length){
    const totals=categoryTotals(current);
    const strongest=strongestCategory(totals);
    if(strongest){
      const [category,amount]=strongest;
      const count=current.filter(item=>item.category===category).length;
      const share=currentTotal>0?amount/currentTotal*100:0;
      observations.push(observationBase({
        id:`largest-category-${period}-${category}`,
        type:count>=3?'emerging':'fact',
        priority:OBSERVATION_PRIORITY.category,
        title:`${category} is ${periodLabel.toLowerCase()}’s largest recorded category.`,
        summary:`${fmt.format(amount)}—about ${share.toFixed(0)}% of recorded spending—is in ${category.toLowerCase()}.`,
        meaning:count>=3
          ? 'The category repeats within this period, but more comparable periods are needed before calling it a lasting pattern.'
          : `This describes the composition of ${periodLabel.toLowerCase()} only.`,
        period:periodLabel,
        source:'Active expense records grouped by category',
        evidence:[
          `${count} ${category.toLowerCase()} record${count===1?'':'s'}`,
          `Category total: ${fmt.format(amount)}`,
          `Period total: ${fmt.format(currentTotal)}`,
          `Share: ${share.toFixed(0)}%`
        ],
        action:{label:'See supporting activity',kind:'snapshot',period}
      }));
    }
  }

  // 8. Recurring commitments total.
  const recurring=libraryRecords(data).filter(({item})=>recordStatus(item)==='active'&&isRecurring(item));
  if(recurring.length){
    const monthlyEquivalent=recurring.reduce((sum,{type,item})=>{
      const amount=recordAmount(type,item);
      const frequency=normalizeRecurrence(item).frequency;
      if(frequency==='weekly')return sum+amount*4.345;
      if(frequency==='biweekly')return sum+amount*2.1725;
      if(frequency==='quarterly')return sum+amount/3;
      if(frequency==='annual')return sum+amount/12;
      if(frequency==='monthly')return sum+amount;
      return sum;
    },0);
    observations.push(observationBase({
      id:'recurring-total',
      type:'estimate',
      priority:OBSERVATION_PRIORITY.recurring,
      title:'Your recurring schedules form a monthly commitment estimate.',
      summary:`The current monthly equivalent is approximately ${fmt.format(monthlyEquivalent)}.`,
      meaning:'This is a normalized estimate from recorded schedules. Variable amounts and custom schedules may change the actual total.',
      period:'Monthly equivalent',
      source:'Active recurring schedules',
      evidence:recurring.slice(0,5).map(({type,item})=>`${recordTitle(type,item,data)} · ${recurrenceLabel(item)} · ${fmt.format(recordAmount(type,item))}`),
      action:{label:'Review recurring records',kind:'library-recurring'}
    }));
  }

  // 9. Repeated similar income.
  const incomes=activeOnly(data.incomes).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  if(incomes.length>=3){
    const latest=incomes[0];
    const similar=incomes.filter(item=>{
      const amount=n(latest.amount);
      return item.sourceName===latest.sourceName&&Math.abs(n(item.amount)-amount)<=Math.max(1,amount*.05);
    });
    if(similar.length>=3){
      observations.push(observationBase({
        id:`income-repeat-${latest.sourceName}`,
        type:similar.length>=4?'established':'emerging',
        priority:OBSERVATION_PRIORITY.income,
        title:`${latest.sourceName} has appeared at a similar amount ${similar.length} times.`,
        summary:`The most recent recorded amount is ${fmt.format(latest.amount)}.`,
        meaning:'Repeated similar income can become a useful reference point, but WealthOS does not assume future income is guaranteed.',
        period:'Recorded income history',
        source:'Active income records',
        evidence:similar.slice(0,4).map(item=>`${formatDate(item.date)} · ${fmt.format(item.amount)}`),
        action:{label:'Review income records',kind:'library-income'}
      }));
    }
  }

  // 10. Limited history.
  if(!observations.length||state.daySpan<7||current.length<2){
    observations.push(observationBase({
      id:`limited-history-${period}`,
      type:'emerging',
      priority:OBSERVATION_PRIORITY.limited,
      title:'A clearer pattern will appear as more records are added.',
      summary:current.length
        ? `${current.length} record${current.length===1?' is':'s are'} useful context, but not enough evidence to call a lasting trend.`
        : `Nothing is recorded for ${periodLabel.toLowerCase()} yet.`,
      meaning:'WealthOS waits for comparable history before using stronger pattern language.',
      period:periodLabel,
      source:'Current knowledge state and active records',
      evidence:[
        `${current.length} record${current.length===1?'':'s'} in this period`,
        `${state.daySpan} day${state.daySpan===1?'':'s'} of recorded history`,
        `Knowledge state: ${state.label}`
      ],
      action:current.length?null:{label:'Record something',kind:'record-expense'}
    }));
  }

  return observations
    .filter((observation,index,array)=>array.findIndex(item=>item.id===observation.id)===index)
    .sort((a,b)=>b.priority-a.priority);
}

function buildObservation(data,fmt,period){
  return generateObservations(data,fmt,period)[0];
}


function renderSnapshotInsight(data,fmt,period){
  const observation=buildObservation(data,fmt,period);
  $('snapshotInsightTitle').textContent=observation.title;
  $('snapshotInsightSummary').textContent=observation.summary;
  $('snapshotInsightReason').textContent=[
    observation.meaning,
    observation.evidence.length?`Evidence: ${observation.evidence.join(' · ')}`:'',
    `Source: ${observation.source}`
  ].filter(Boolean).join(' ');
  $('snapshotInsightConfidence').textContent=`${observationConfidenceLabel(observation)} · ${observation.period}`;
}

function renderSnapshot(data,fmt,period){
  const labels={daily:'Today',weekly:'This week',monthly:'This month'},source=spendingSource(data,period),amount=source.amount,records=source.records,monthlyIncome=n(data.income?.current);
  let monthlyEquivalent=amount;if(period==='daily')monthlyEquivalent=amount*30;if(period==='weekly')monthlyEquivalent=amount*4.345;
  const comparisonAmount=period==='monthly'?amount:monthlyEquivalent,percent=monthlyIncome>0?comparisonAmount/monthlyIncome*100:null,remaining=monthlyIncome-amount;
  $('snapshotPeriod').textContent=labels[period];$('snapshotSource').textContent=source.text;$('snapshotValue').textContent=fmt.format(amount);
  $('snapshotContext').textContent=amount===0?(period==='daily'?'Record a purchase to begin today’s picture.':`Add or update ${period} spending to begin this Snapshot.`):percent!==null?(period==='monthly'?`${percent.toFixed(0)}% of this month’s income has been recorded as spending.`:`At this pace, spending equals about ${percent.toFixed(0)}% of monthly income.`):'Add monthly income to place this spending in context.';
  if(period==='daily'){
    $('metricOneLabel').textContent='Purchases recorded';$('metricOneValue').textContent=String(records.length);
    $('metricTwoLabel').textContent='Share of monthly income';$('metricTwoValue').textContent=percent===null?'—':`${percent.toFixed(1)}%`;
    $('metricThreeLabel').textContent='Estimated monthly pace';$('metricThreeValue').textContent=fmt.format(monthlyEquivalent);
    $('snapshotUpdateButton').textContent='Add today’s spending →';
  }else if(period==='weekly'){
    $('metricOneLabel').textContent='Recorded total';$('metricOneValue').textContent=fmt.format(amount);
    $('metricTwoLabel').textContent='Share of monthly income';$('metricTwoValue').textContent=percent===null?'—':`${percent.toFixed(0)}%`;
    $('metricThreeLabel').textContent='Estimated monthly pace';$('metricThreeValue').textContent=fmt.format(monthlyEquivalent);
    $('snapshotUpdateButton').textContent=source.type==='expenses'?'Add another purchase →':'Update weekly spending →';
  }else{
    $('metricOneLabel').textContent='Recorded spending';$('metricOneValue').textContent=fmt.format(amount);
    $('metricTwoLabel').textContent='Share of monthly income';$('metricTwoValue').textContent=percent===null?'—':`${percent.toFixed(0)}%`;
    $('metricThreeLabel').textContent='Remaining after spending';$('metricThreeValue').textContent=monthlyIncome>0?fmt.format(remaining):'—';
    $('snapshotUpdateButton').textContent='Update monthly check-in →';
  }
  $('snapshotUpdateButton').dataset.period=period;renderSnapshotInsight(data,fmt,period);renderRecentReceipts(data,period,fmt);
  const closingObservation=buildObservation(data,fmt,period);
  $('snapshotNote').textContent=amount===0
    ? 'Once activity is recorded, WealthOS will begin separating isolated events from patterns.'
    : closingObservation.meaning;
  document.querySelectorAll('.period-button').forEach(button=>button.classList.toggle('active',button.dataset.period===period));
}

function openCheckin(type){
  const data=loadData();
  $('checkinType').value=type;
  $('checkinModalTitle').textContent=type==='weekly'?'Weekly Check-in':'Monthly Check-in';
  $('weeklyFields').hidden=type!=='weekly';
  $('monthlyFields').hidden=type!=='monthly';

  if(type==='weekly'){
    $('weeklySpentInput').value=data.spending?.weekly||'';
  }else{
    $('monthlyIncomeInput').value=data.income?.current??'';
    $('monthlySpentInput').value=data.spending?.monthly||'';
    $('monthlySavedInput').value='';
  }

  $('checkinNoteInput').value='';
  $('checkinModal').classList.add('open');
  $('checkinModal').setAttribute('aria-hidden','false');
}
function closeCheckin(){
  $('checkinModal').classList.remove('open');
  $('checkinModal').setAttribute('aria-hidden','true');
}
function saveCheckin(event){
  event.preventDefault();
  const data=loadData();
  const type=$('checkinType').value;
  const date=new Date().toISOString().slice(0,10);
  const note=$('checkinNoteInput').value.trim();

  if(type==='weekly'){
    const spent=Math.max(0,n($('weeklySpentInput').value));
    data.spending.weekly=spent;
    data.checkins.push({id:Date.now(),type,date,spent,note,isFresh:true});
  }else{
    const income=Math.max(0,n($('monthlyIncomeInput').value));
    const spent=Math.max(0,n($('monthlySpentInput').value));
    const saved=Math.max(0,n($('monthlySavedInput').value));
    data.income.current=income;
    data.income.currentMonth=nowMonth;
    data.spending.monthly=spent;
    const roadmap=primaryRoadmap(data);
    if(saved>0&&roadmap){
      roadmap.saved=Math.min(n(roadmap.target),n(roadmap.saved)+saved);
      roadmap.status=roadmap.saved>=n(roadmap.target)?'complete':'active';
    }else if(saved>0){
      data.emergency.balance=n(data.emergency.balance)+saved;
    }
    data.checkins.push({id:Date.now(),type,date,income,spent,saved,note,isFresh:true});
  }

  data.onboardingComplete=true;
  const latest=data.checkins.at(-1);
  data.memory={
    lastInteraction:'checkin',
    lastCheckinType:type,
    lastCheckinDate:date,
    lastSummary:type==='weekly'
      ? `You completed a weekly check-in and recorded approximately ${money(data.profile.currency).format(n(latest.spent))} of spending.`
      : `You completed a monthly check-in and added a new chapter to your Timeline.`,
  };
  saveData(data);
  closeCheckin();
  render(data);
  openLoop(type,data);

  // Preserve the animation for this render only.
  latest.isFresh=false;
  saveData(data);
}


function openAboutSection(sectionTitle){
  $('aboutPanel').classList.add('open');
  $('panelBackdrop').hidden=false;
  const headings=[...$('aboutForm').querySelectorAll('.form-section h3')];
  const target=headings.find(h=>h.textContent.trim()===sectionTitle);
  if(target)setTimeout(()=>target.closest('.form-section').scrollIntoView({behavior:'smooth',block:'start'}),80);
}
function openContribution(roadmapId=''){
  const data=loadData();
  const roadmaps=activeRoadmaps(data);
  const select=$('contributionRoadmap');
  select.innerHTML='';

  roadmaps.forEach(roadmap=>{
    const option=document.createElement('option');
    option.value=roadmap.id;
    option.textContent=roadmap.name;
    option.selected=roadmap.id===(roadmapId||primaryRoadmap(data)?.id);
    select.append(option);
  });

  const hasRoadmap=roadmaps.length>0;
  $('contributionRoadmapLabel').hidden=!hasRoadmap;
  $('contributionTitle').textContent=hasRoadmap?'Record a Roadmap contribution':'Update your emergency fund';
  $('contributionHelp').textContent=hasRoadmap
    ? 'This contribution will update the selected Roadmap and may create a new Financial Memory.'
    : 'This will add to your current emergency-fund balance.';
  $('contributionAmount').value='';
  $('contributionModal').classList.add('open');
  $('contributionModal').setAttribute('aria-hidden','false');
}
function closeContribution(){
  $('contributionModal').classList.remove('open');
  $('contributionModal').setAttribute('aria-hidden','true');
}
function saveContribution(event){
  event.preventDefault();
  const amount=Math.max(0,n($('contributionAmount').value));
  if(amount<=0)return;
  const data=loadData();
  const roadmapId=$('contributionRoadmap').value;
  const roadmap=(data.roadmaps||[]).find(item=>item.id===roadmapId);

  if(roadmap){
    roadmap.saved=Math.min(n(roadmap.target),n(roadmap.saved)+amount);
    roadmap.status=roadmap.saved>=n(roadmap.target)?'complete':'active';
    data.memory={
      ...(data.memory||{}),
      lastInteraction:'roadmap',
      lastCheckinDate:localDateKey(),
      lastSummary:`You added ${money(data.profile.currency).format(amount)} to ${roadmap.name}.`
    };
  }else{
    data.emergency.balance=n(data.emergency.balance)+amount;
  }

  data.checkins.push({
    id:Date.now(),
    type:'contribution',
    date:localDateKey(),
    amount,
    roadmapId:roadmap?.id||null,
    roadmapName:roadmap?.name||'Emergency fund'
  });

  syncLegacyChallenge(data);
  updateFinancialMemories(data);
  saveData(data);
  closeContribution();
  render(data);
  location.hash='roadmaps';
}
function routeNextAction(){
  const data=loadData();
  const te=n(data.taxes.estimate),tr=n(data.taxes.reserved),short=Math.max(0,te-tr);
  const ess=n(data.emergency.essentials),complete=ess>0&&n(data.emergency.balance)>=ess*n(data.emergency.targetMonths,6);
  if(te>0&&short>0){openAboutSection('Quarterly taxes');return}
  if(ess>0&&!complete){openAboutSection('Emergency fund');return}
  const roadmap=primaryRoadmap(data);if(roadmap&&n(roadmap.target)>n(roadmap.saved)){openContribution(roadmap.id);return}
  openAboutSection('You');
}


function chooseLoopLesson(type,data){
  if(type==='weekly')return{category:'Cash Flow',title:'What is the difference between fixed and variable expenses?',summary:'Fixed expenses tend to remain consistent. Variable expenses change with use, frequency, or choice.'};
  if(n(data.checkins?.at(-1)?.saved)>0)return{category:'Saving',title:'What is a sinking fund?',summary:'A sinking fund is money saved gradually for a known future expense.'};
  return{category:'Foundations',title:'What is cash flow?',summary:'Cash flow is the movement of money into and out of your financial life over a period of time.'};
}

function chooseLoopNextStep(type,data){
  if(type==='weekly'){
    return {
      title:'Review your Spending Snapshot.',
      text:'See how this week compares with your monthly income and current pace.',
      action:'snapshot'
    };
  }
  const roadmap=primaryRoadmap(data);
  if(roadmap&&n(roadmap.target)>n(roadmap.saved)){
    return {
      title:`Continue ${roadmap.name}.`,
      text:'Your monthly check-in is complete. One contribution can keep this Roadmap moving.',
      action:'contribution'
    };
  }
  return {
    title:'Review the chapter you just added.',
    text:'Your Timeline now remembers this check-in as part of your financial story.',
    action:'timeline'
  };
}

function buildLoopPayload(type,data){
  const fmt=money(data.profile.currency);
  const latest=(data.checkins||[]).at(-1)||{};
  const lesson=chooseLoopLesson(type,data);
  const next=chooseLoopNextStep(type,data);

  if(type==='weekly'){
    const spent=n(latest.spent);
    const income=n(data.income.current);
    const monthlyEquivalent=spent*4.345;
    const pct=income>0?monthlyEquivalent/income*100:null;
    return {
      completion:`You recorded approximately ${fmt.format(spent)} of spending this week.`,
      label:'This week',
      value:fmt.format(spent),
      context:pct===null
        ? 'This check-in is now part of your Timeline. Add monthly income to place weekly spending in context.'
        : `At this pace, weekly spending equals about ${pct.toFixed(0)}% of monthly income.`,
      actionContext:contextForCheckin(type,data),
      lesson,
      next
    };
  }

  const income=n(latest.income);
  const spent=n(latest.spent);
  const saved=n(latest.saved);
  const remaining=income-spent;
  return {
    completion:`You closed the month with ${fmt.format(income)} of income and ${fmt.format(spent)} of spending.`,
    label:'This month',
    value:fmt.format(remaining),
    context:`After recorded spending, ${fmt.format(remaining)} remains. You also recorded ${fmt.format(saved)} of saving.`,
    actionContext:contextForCheckin(type,data),
    lesson,
    next
  };
}

function showLoopStep(step){
  document.querySelectorAll('.loop-step').forEach(section=>{
    section.classList.toggle('active',Number(section.dataset.loopStep)===step);
  });
  document.querySelectorAll('.loop-progress span').forEach((bar,index)=>{
    bar.classList.toggle('active',index<step);
  });
  $('loopModal').dataset.current=String(step);
}

function openLoop(type,data){
  const payload=buildLoopPayload(type,data);
  $('loopCompletionSummary').textContent=payload.completion;
  $('loopContextLabel').textContent=payload.label;
  $('loopContextValue').textContent=payload.value;
  $('loopContextText').textContent=payload.context;
  $('loopActionContextTitle').textContent=payload.actionContext.concept;
  $('loopActionContext').textContent=payload.actionContext.explanation;
  $('loopActionContextWit').textContent=payload.actionContext.wit||'';
  $('loopLessonCategory').textContent=payload.lesson.category;
  $('loopLessonTitle').textContent=payload.lesson.title;
  $('loopLessonSummary').textContent=payload.lesson.summary;
  $('loopNextTitle').textContent=payload.next.title;
  $('loopNextText').textContent=payload.next.text;
  $('loopActionButton').dataset.action=payload.next.action;
  showLoopStep(1);
  $('loopModal').classList.add('open');
  $('loopModal').setAttribute('aria-hidden','false');
}

function closeLoop(){
  $('loopModal').classList.remove('open');
  $('loopModal').setAttribute('aria-hidden','true');
}

function runLoopAction(){
  const action=$('loopActionButton').dataset.action;
  closeLoop();
  if(action==='snapshot'){location.hash='spendingSnapshot';return}
  if(action==='timeline'){location.hash='timeline';return}
  if(action==='contribution'){openContribution();return}
  location.hash='focus';
}

function renderReturnMemory(data){
  const memory=data.memory||{};
  if(!memory.lastInteraction||!memory.lastSummary){
    $('returnMemory').hidden=true;
    return;
  }
  $('returnMemory').hidden=false;
  $('returnMemoryText').textContent=memory.lastSummary;
}

function populateAbout(d){
  fillCurrency($('currencyInput'),d.profile.currency);$('nameInput').value=d.profile.name;$('incomeSourceName').value=d.income.source;$('incomeMonth').value=d.income.currentMonth;$('incomeCurrent').value=d.income.current??'';$('taxDueDate').value=d.taxes.dueDate;$('taxEstimate').value=d.taxes.estimate;$('taxReserved').value=d.taxes.reserved;$('emergencyBalance').value=d.emergency.balance;$('essentialExpenses').value=d.emergency.essentials||'';$('targetMonths').value=d.emergency.targetMonths;$('emergencyContribution').value=d.emergency.monthlyContribution;$('challengeEnabled').checked=d.challenge.enabled;$('challengeName').value=d.challenge.name;$('challengeTarget').value=d.challenge.target;$('challengeSaved').value=d.challenge.saved;$('challengeStart').value=d.challenge.startDate;$('challengeDuration').value=d.challenge.durationWeeks;$('challengeFrequency').value=d.challenge.frequency;toggleChallenge();renderHistoryManager(d);
}
function renderHistoryManager(d){
  const box=$('historyManagerList');box.innerHTML='';(d.incomeHistory||[]).sort((a,b)=>b.month.localeCompare(a.month)).forEach(x=>{const row=document.createElement('div');row.className='history-manager-row';row.innerHTML=`<span>${formatMonth(x.month)}</span><strong>${money(d.profile.currency).format(x.amount)}</strong><button class="delete-history" type="button">Remove</button>`;row.querySelector('button').onclick=()=>{const latest=loadData();latest.incomeHistory=latest.incomeHistory.filter(y=>y.month!==x.month);saveData(latest);render(latest)};box.append(row)});
}
function readAbout(){
  const d=loadData(),newMonth=$('incomeMonth').value||nowMonth;
  if(d.income.current!==null&&d.income.currentMonth!==newMonth)d.incomeHistory.push({month:d.income.currentMonth,amount:n(d.income.current)});
  d.onboardingComplete=true;d.profile={name:$('nameInput').value.trim(),currency:$('currencyInput').value};d.income={source:$('incomeSourceName').value.trim()||'Income',currentMonth:newMonth,current:n($('incomeCurrent').value)};d.taxes={dueDate:$('taxDueDate').value,estimate:n($('taxEstimate').value),reserved:n($('taxReserved').value)};d.emergency={balance:n($('emergencyBalance').value),essentials:n($('essentialExpenses').value),targetMonths:n($('targetMonths').value,6),monthlyContribution:n($('emergencyContribution').value)};d.challenge={enabled:$('challengeEnabled').checked,name:$('challengeName').value.trim(),target:n($('challengeTarget').value),saved:n($('challengeSaved').value),startDate:$('challengeStart').value,durationWeeks:n($('challengeDuration').value,12),frequency:$('challengeFrequency').value};
  if(d.challenge.enabled&&d.challenge.name&&d.challenge.target>0){
    const roadmap=primaryRoadmap(d);
    if(roadmap){
      roadmap.name=d.challenge.name;roadmap.target=d.challenge.target;roadmap.saved=Math.min(d.challenge.saved,d.challenge.target);roadmap.startDate=d.challenge.startDate||roadmap.startDate;roadmap.status=roadmap.saved>=roadmap.target?'complete':'active';
    }else{
      d.roadmaps.push({id:`roadmap-${Date.now()}`,name:d.challenge.name,type:'other',target:d.challenge.target,saved:Math.min(d.challenge.saved,d.challenge.target),startDate:d.challenge.startDate||localDateKey(),targetDate:'',monthlyContribution:0,status:'active'});
    }
  }
  syncLegacyChallenge(d);return d;
}
function toggleChallenge(){const on=$('challengeEnabled').checked;$('challengeFields').style.opacity=on?'1':'.45';$('challengeFields').querySelectorAll('input,select').forEach(x=>x.disabled=!on)}
function openOnboarding(){$('onboarding').classList.add('open');$('onboarding').setAttribute('aria-hidden','false');showStep(1)}
function closeOnboarding(){$('onboarding').classList.remove('open');$('onboarding').setAttribute('aria-hidden','true')}
function showStep(step){document.querySelectorAll('.onboarding-step').forEach(x=>x.classList.toggle('active',Number(x.dataset.step)===step));$('onboarding').dataset.current=step}
document.querySelectorAll('.onboarding-next').forEach(b=>b.onclick=()=>showStep(Math.min(5,n($('onboarding').dataset.current,1)+1)));
document.querySelectorAll('.onboarding-back').forEach(b=>b.onclick=()=>showStep(Math.max(1,n($('onboarding').dataset.current,1)-1)));
document.querySelectorAll('[data-begin-story]').forEach(b=>b.onclick=openOnboarding);$('beginStoryButton').onclick=openOnboarding;$('closeOnboarding').onclick=closeOnboarding;
document.querySelectorAll('input[name="challengeChoice"]').forEach(r=>r.onchange=()=>$('onboardingChallengeFields').hidden=document.querySelector('input[name="challengeChoice"]:checked').value!=='yes');
fillCurrency($('onboardingCurrency'),'USD');$('onboardingIncomeMonth').value=nowMonth;
$('onboardingForm').onsubmit=e=>{
  e.preventDefault();const d=blankData();d.onboardingComplete=true;d.profile={name:$('onboardingName').value.trim(),currency:$('onboardingCurrency').value};d.income={source:$('onboardingIncomeSource').value.trim()||'Total income',currentMonth:$('onboardingIncomeMonth').value||nowMonth,current:n($('onboardingIncomeAmount').value)};const yes=document.querySelector('input[name="challengeChoice"]:checked').value==='yes';d.challenge.enabled=yes;if(yes){d.challenge.name=$('onboardingChallengeName').value.trim()||'Savings';d.challenge.target=n($('onboardingChallengeTarget').value);d.challenge.startDate=localDateKey();d.roadmaps=[{id:`roadmap-${Date.now()}`,name:d.challenge.name,type:/emergency/i.test(d.challenge.name)?'emergency':/travel|trip|vacation/i.test(d.challenge.name)?'travel':'other',target:d.challenge.target,saved:0,startDate:d.challenge.startDate,targetDate:'',monthlyContribution:0,status:'active'}]}saveData(syncLegacyChallenge(d));closeOnboarding();render(d);location.hash='focus';
};
$('aboutTrigger').onclick=()=>{$('aboutPanel').classList.add('open');$('panelBackdrop').hidden=false};$('closePanel').onclick=()=>{$('aboutPanel').classList.remove('open');$('panelBackdrop').hidden=true};$('panelBackdrop').onclick=$('closePanel').onclick;
$('challengeEnabled').onchange=toggleChallenge;$('aboutForm').onsubmit=e=>{e.preventDefault();const d=readAbout();saveData(d);render(d);$('closePanel').click()};
$('clearPreviewButton').onclick=()=>{if(confirm('Start fresh on this browser? This removes the saved Private Preview data.')){localStorage.removeItem(STORAGE_KEY);for(const k of LEGACY_KEYS)localStorage.removeItem(k);$('closePanel').click();render(blankData());location.hash='lobby'}};
document.querySelectorAll('.signal-button').forEach(b=>b.onclick=()=>{const card=b.closest('.signal-card'),open=card.classList.toggle('open');b.setAttribute('aria-expanded',String(open))});
document.querySelectorAll('.period-button').forEach(button=>button.addEventListener('click',()=>{const data=loadData();renderSnapshot(data,money(data.profile.currency),button.dataset.period)}));
$('newRoadmapButton').addEventListener('click',()=>openRoadmapModal());
$('closeRoadmapModal').addEventListener('click',closeRoadmapModal);
$('cancelRoadmap').addEventListener('click',closeRoadmapModal);
$('roadmapModal').addEventListener('click',event=>{if(event.target===$('roadmapModal'))closeRoadmapModal()});
$('roadmapForm').addEventListener('submit',saveRoadmap);
$('libraryRecordButton').addEventListener('click',()=>openRecordModal('expense'));
let librarySearchScrollTimer=null;
$('librarySearch').addEventListener('input',()=>{
  renderRecordLibrary(loadData());
  clearTimeout(librarySearchScrollTimer);
  librarySearchScrollTimer=setTimeout(()=>{
    if($('librarySearch').value.trim()&&filteredLibraryRecords(loadData()).length){
      $('recordResultsHeading').scrollIntoView({behavior:'smooth',block:'start'});
    }
  },350);
});
$('librarySearch').addEventListener('change',()=>{
  if($('librarySearch').value.trim())rememberLibrarySearch($('librarySearch').value.trim());
});
$('librarySearch').addEventListener('keydown',event=>{
  if(event.key==='Enter'){
    event.preventDefault();
    if($('librarySearch').value.trim())rememberLibrarySearch($('librarySearch').value.trim());
    renderRecordLibrary(loadData());
  }
});
$('libraryClearSearch').addEventListener('click',clearLibrarySearch);
$('libraryMoreFilters').addEventListener('click',toggleAdvancedFilters);
document.querySelectorAll('[data-library-period]').forEach(button=>{
  button.addEventListener('click',()=>setLibraryPeriod(button.dataset.libraryPeriod));
});
document.querySelectorAll('[data-library-recurrence="recurring"]').forEach(button=>{
  button.addEventListener('click',()=>setRecurringQuickFilter(!libraryView.recurringOnly));
});
['libraryType','libraryRecurrence','librarySource','libraryDateFrom','libraryDateTo'].forEach(id=>{
  $(id).addEventListener('change',()=>renderRecordLibrary(loadData()));
});
$('libraryClearFilters').addEventListener('click',resetLibraryView);
$('recordRecurrence').addEventListener('change',()=>{
  if($('recordType').value==='bill'&&$('recordRecurrence').value==='once'){
    $('recordRecurrence').value='monthly';
    recordError('Recurring bills need a repeating schedule. Choose monthly, weekly, annual, or custom.');
  }
  if($('recordRecurrence').value!=='once'&&!$('recordNextExpectedDate').value){
    $('recordNextExpectedDate').value=defaultNextExpectedDate($('recordDate').value||localDateKey(),$('recordRecurrence').value);
  }
  updateRecurrenceFields('record');
});
$('recordCustomInterval').addEventListener('input',()=>updateRecurrenceFields('record'));
$('recordCustomUnit').addEventListener('change',()=>updateRecurrenceFields('record'));
$('makeRecurringButton').addEventListener('click',openRecurringModal);
$('closeRecurringModal').addEventListener('click',closeRecurringModal);
$('cancelRecurring').addEventListener('click',closeRecurringModal);
$('recurringModal').addEventListener('click',event=>{if(event.target===$('recurringModal'))closeRecurringModal()});
$('recurringFrequency').addEventListener('change',()=>updateRecurrenceFields('recurring'));
$('recurringForm').addEventListener('submit',saveRecurringSchedule);
$('closeRecordDetail').addEventListener('click',closeRecordDetail);
$('recordDetailModal').addEventListener('click',event=>{if(event.target===$('recordDetailModal'))closeRecordDetail()});
$('editRecordButton').addEventListener('click',openRecordEdit);
$('archiveRecordButton').addEventListener('click',archiveSelectedRecord);
$('reverseRecordButton').addEventListener('click',reverseSelectedRecord);
$('closeRecordEdit').addEventListener('click',closeRecordEdit);
$('cancelRecordEdit').addEventListener('click',closeRecordEdit);
$('recordEditModal').addEventListener('click',event=>{if(event.target===$('recordEditModal'))closeRecordEdit()});
$('recordEditForm').addEventListener('submit',saveRecordEdit);
$('foundationRecordButton').addEventListener('click',()=>openRecordModal('expense'));
$('closeRecordModal').addEventListener('click',closeRecordModal);
$('cancelRecord').addEventListener('click',closeRecordModal);
$('recordModal').addEventListener('click',event=>{if(event.target===$('recordModal'))closeRecordModal()});
$('recordType').addEventListener('change',updateRecordFields);
$('recordForm').addEventListener('submit',saveCoreRecord);
$('workspaceObservationWhy').addEventListener('click',()=>{
  const detail=$('workspaceObservationDetail');
  const opening=detail.hidden;
  detail.hidden=!opening;
  $('workspaceObservationWhy').setAttribute('aria-expanded',String(opening));
  $('workspaceObservationWhy').textContent=opening?'Why? −':'Why? +';
});
$('workspaceFocusAction').addEventListener('click',()=>performWorkspaceAction($('workspaceFocusAction').dataset.action));
$('workspaceContinueAction').addEventListener('click',()=>performWorkspaceAction($('workspaceContinueAction').dataset.action));
$('workspaceQuickAdd').addEventListener('click',()=>openRecordModal('expense'));
$('quickAddTrigger').addEventListener('click',()=>openRecordModal('expense'));
$('addAnotherExpense').addEventListener('click',()=>openRecordModal('expense'));
$('closeQuickAdd').addEventListener('click',closeQuickAdd);
$('cancelQuickAdd').addEventListener('click',closeQuickAdd);
$('quickAddModal').addEventListener('click',event=>{if(event.target===$('quickAddModal'))closeQuickAdd()});
$('quickAddForm').addEventListener('submit',saveQuickAdd);
$('expenseToastView').addEventListener('click',()=>{$('expenseToast').classList.remove('show');location.hash='spendingSnapshot'});
$('expenseToastDone').addEventListener('click',()=>$('expenseToast').classList.remove('show'));
$('expenseToastClose').addEventListener('click',()=>$('expenseToast').classList.remove('show'));

$('snapshotInsightWhy').addEventListener('click',()=>{
  const insight=$('snapshotInsight');
  const open=insight.classList.toggle('open');
  $('snapshotInsightWhy').setAttribute('aria-expanded',String(open));
  $('snapshotInsightWhy').textContent=open?'Why? ×':'Why? +';
});
$('snapshotUpdateButton').addEventListener('click',()=>{
  const period=$('snapshotUpdateButton').dataset.period||'weekly';
  if(period==='daily'){openRecordModal('expense');return}
  if(period==='weekly'){const data=loadData();if(expensesForPeriod(data,'weekly').length){openRecordModal('expense');return}openCheckin('weekly');return}
  openCheckin('monthly');
});
document.querySelectorAll('[data-open-checkin]').forEach(button=>button.addEventListener('click',()=>openCheckin(button.dataset.openCheckin)));
$('closeCheckin').addEventListener('click',closeCheckin);
$('cancelCheckin').addEventListener('click',closeCheckin);
$('checkinForm').addEventListener('submit',saveCheckin);
$('checkinModal').addEventListener('click',event=>{if(event.target===$('checkinModal'))closeCheckin()});
$('attentionAction').addEventListener('click',()=>openAboutSection('Quarterly taxes'));
$('progressAction').addEventListener('click',()=>{
  const data=loadData();
  if(data.challenge.enabled&&n(data.challenge.target)>0)openContribution();
  else openAboutSection('Emergency fund');
});
$('nextAction').addEventListener('click',routeNextAction);
$('nextPreviewButton').addEventListener('click',event=>{event.stopPropagation();routeNextAction()});
$('nextPreviewButton').addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();routeNextAction()}});
document.querySelectorAll('.loop-next').forEach(button=>button.addEventListener('click',()=>{
  const current=n($('loopModal').dataset.current,1);
  showLoopStep(Math.min(4,current+1));
}));
$('loopFinishButton').addEventListener('click',closeLoop);
$('loopActionButton').addEventListener('click',runLoopAction);
$('loopModal').addEventListener('click',event=>{if(event.target===$('loopModal'))closeLoop()});

$('envelopeAction').addEventListener('click',()=>{
  const envelope=$('savingsEnvelope');
  envelope.classList.toggle('open');
  const data=loadData();
  setTimeout(()=>{
    if(data.challenge.enabled&&n(data.challenge.target)>0)openContribution();
    else openAboutSection('Emergency fund');
  },envelope.classList.contains('open')?180:0);
});
$('closeContribution').addEventListener('click',closeContribution);
$('cancelContribution').addEventListener('click',closeContribution);
$('contributionForm').addEventListener('submit',saveContribution);
$('contributionModal').addEventListener('click',event=>{if(event.target===$('contributionModal'))closeContribution()});
$('flexibleDefinitionToggle').addEventListener('click',()=>{
  const box=$('flexibleDefinitionToggle').closest('.economic-definition');
  const open=box.classList.toggle('open');
  $('flexibleDefinitionToggle').setAttribute('aria-expanded',String(open));
});
$('lessonToggle').addEventListener('click',()=>{
  const card=$('lessonCard');
  const open=card.classList.toggle('open');
  $('lessonToggle').setAttribute('aria-expanded',String(open));
});
render(loadData());
