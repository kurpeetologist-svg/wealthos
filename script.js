
'use strict';

const STORAGE_KEY='wealthos-v0.16.0-data';
const LEGACY_KEYS=['wealthos-v0.15.1-data','wealthos-v0.15.0-data','wealthos-v0.14.1-data','wealthos-v0.14.0-data','wealthos-v0.13.0-data','wealthos-v0.12.0-data','wealthos-v0.11.0-data','wealthos-v0.10.1-data','wealthos-v0.10.0-data','wealthos-v0.9.4-data','wealthos-v0.9.3-data','wealthos-v0.9.2.1-data','wealthos-v0.9.2-data','wealthos-v0.9.1-data','wealthos-v0.9-data','wealthos-v0.8-data','wealthos-v0.7-data','wealthos-v0.6-data'];
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
  spending:{daily:0,weekly:0,monthly:0},
  expenses:[],
  checkins:[],
  memory:{lastInteraction:null,lastCheckinType:null,lastCheckinDate:null,lastSummary:null}
});

function n(v,f=0){const x=Number(v);return Number.isFinite(x)?x:f}
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
  d.spending={daily:Math.max(0,n(raw.spending?.daily)),weekly:Math.max(0,n(raw.spending?.weekly)),monthly:Math.max(0,n(raw.spending?.monthly))};
  d.expenses=Array.isArray(raw.expenses)?raw.expenses.filter(item=>item&&item.date).map(item=>({
    id:item.id||Date.now()+Math.random(),amount:Math.max(0,n(item.amount)),category:String(item.category||'Other'),
    merchant:String(item.merchant||''),note:String(item.note||''),date:String(item.date)
  })):[];
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
  const h=new Date().getHours();
  $('greeting').textContent=(h<12?'Good morning!':h<18?'Good afternoon!':'Good evening!');
  $('reflection').textContent="Let's see where you stand today.";
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

  if(data.challenge.enabled&&n(data.challenge.target)>n(data.challenge.saved)){
    return{
      title:`Continue ${data.challenge.name||'your savings goal'}.`,
      text:'One contribution can keep the goal moving without turning today into a full financial review.',
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

  if(data.challenge.enabled&&n(data.challenge.target)>0){
    return{
      title:`Continue ${data.challenge.name||'your savings goal'}.`,
      text:'Your goal folder is ready whenever you want to add another contribution.',
      label:'Open goal',
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
  if(action==='quickAdd'){openQuickAdd();return}
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

function renderWorkspace(data,fmt){
  const focus=chooseWorkspaceFocus(data);
  $('workspaceFocusTitle').textContent=focus.title;
  $('workspaceFocusText').textContent=focus.text;
  $('workspaceFocusAction').innerHTML=`${focus.label} <b>→</b>`;
  $('workspaceFocusAction').dataset.action=focus.action;
  $('workspaceFocusTime').textContent=focus.time;

  $('workspaceIncome').textContent=fmt.format(n(data.income.current));
  $('workspaceSpentToday').textContent=fmt.format(expenseTotal(expensesForPeriod(data,'daily')));
  const saved=data.challenge.enabled?n(data.challenge.saved):n(data.emergency.balance);
  $('workspaceSaved').textContent=fmt.format(saved);

  renderWorkspaceActivity(data,fmt);

  const observation=buildObservation(data,fmt,'daily');
  $('workspaceObservationTitle').textContent=observation.title;
  $('workspaceObservationSummary').textContent=observation.summary;

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
  greeting();
  renderLesson();
  const returning=hasMeaningfulData(data);
  showState(returning);
  assembleFinancialDesk();
  if(!returning)return;
  const fmt=money(data.profile.currency),h=sortedHistory(data),s=stats(h),cur=n(s.cur.amount),prev=s.prev?n(s.prev.amount):null,delta=prev===null?null:cur-prev,pct=prev>0?delta/prev*100:null,source=data.income.source||'Income';
  renderWorkspace(data,fmt);
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
  if(CONTEXT_LIBRARY.expense[category])return CONTEXT_LIBRARY.expense[category];

  const haystack=normalizeContextText(`${expense.merchant||''} ${expense.note||''} ${category}`);
  for(const entry of Object.values(CONTEXT_LIBRARY.expense)){
    if((entry.aliases||[]).some(alias=>haystack.includes(normalizeContextText(alias))))return entry;
  }
  return CONTEXT_LIBRARY.expense.Other;
}

function contextForExpense(expense){
  return expenseContextEntry(expense);
}

function contextForCheckin(type,data){
  if(type==='weekly')return CONTEXT_LIBRARY.checkin.weekly;

  const latest=(data.checkins||[]).at(-1)||{};
  const income=n(latest.income);
  const spent=n(latest.spent);
  const saved=n(latest.saved);

  if(saved>0)return CONTEXT_LIBRARY.checkin.monthlySaving;
  if(income>0&&spent>income)return CONTEXT_LIBRARY.checkin.monthlyNegative;
  return CONTEXT_LIBRARY.checkin.monthly;
}

function localDateKey(date=new Date()){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`}
function startOfWeek(date=new Date()){const result=new Date(date);result.setHours(0,0,0,0);const day=result.getDay(),offset=day===0?6:day-1;result.setDate(result.getDate()-offset);return result}
function expensesForPeriod(data,period){
  const expenses=[...(data.expenses||[])],today=new Date();today.setHours(0,0,0,0);
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
  const recentExpenses=[...(data.expenses||[])].sort((a,b)=>String(b.date).localeCompare(String(a.date))||n(b.id)-n(a.id)).slice(0,8),expenseGroups=new Map();
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
  (data.expenses||[])
    .filter(item=>String(item.date).slice(0,7)===monthKey)
    .forEach(item=>totals.set(item.category,(totals.get(item.category)||0)+n(item.amount)));
  return totals;
}

function strongestCategory(totals){
  return [...totals.entries()].sort((a,b)=>b[1]-a[1])[0]||null;
}

function buildObservation(data,fmt,period){
  const currentKey=currentMonthKey();
  const previousKey=previousMonthKey();
  const currentTotals=categoryTotalsForMonth(data,currentKey);
  const previousTotals=categoryTotalsForMonth(data,previousKey);
  const strongest=strongestCategory(currentTotals);

  let title='A clearer pattern will appear as more records are added.';
  let summary='One purchase is useful context, but not enough evidence to call a trend.';
  let reason='WealthOS waits for enough comparable history before describing spending as higher, lower, or unusual.';

  if(strongest){
    const [category,currentAmount]=strongest;
    const previousAmount=previousTotals.get(category)||0;
    const currentCount=(data.expenses||[]).filter(item=>String(item.date).slice(0,7)===currentKey&&item.category===category).length;

    if(previousAmount>0){
      const change=(currentAmount-previousAmount)/previousAmount*100;
      const absolute=Math.abs(currentAmount-previousAmount);

      if(Math.abs(change)<5){
        title=`${category} spending is holding fairly steady this month.`;
        summary=`You recorded ${fmt.format(currentAmount)} this month compared with ${fmt.format(previousAmount)} last month.`;
        reason=`The difference is ${fmt.format(absolute)}, which is less than 5% of last month’s ${category.toLowerCase()} total.`;
      }else if(change<0){
        title=`Your ${category.toLowerCase()} spending decreased ${Math.abs(change).toFixed(0)}%.`;
        summary=`You recorded ${fmt.format(currentAmount)} this month compared with ${fmt.format(previousAmount)} last month.`;
        reason=`That is ${fmt.format(absolute)} less than the previous month. WealthOS is comparing Quick Add records in the same category across two months.`;
      }else{
        title=`Your ${category.toLowerCase()} spending increased ${change.toFixed(0)}%.`;
        summary=`You recorded ${fmt.format(currentAmount)} this month compared with ${fmt.format(previousAmount)} last month.`;
        reason=`That is ${fmt.format(absolute)} more than the previous month. This is an observation, not a judgment.`;
      }
    }else if(currentCount>=3){
      title=`${category} is your largest recorded spending category this month.`;
      summary=`You recorded ${fmt.format(currentAmount)} across ${currentCount} purchases.`;
      reason=`There is not yet a comparable ${category.toLowerCase()} total from last month, so WealthOS is describing the current month rather than claiming a trend.`;
    }else{
      title=`${category} is currently your largest recorded category.`;
      summary=`You have ${currentCount} recorded purchase${currentCount===1?'':'s'} totaling ${fmt.format(currentAmount)}.`;
      reason='More history is needed before WealthOS can compare this category across time.';
    }
  }

  if(period==='daily'){
    const todayRecords=expensesForPeriod(data,'daily');
    if(todayRecords.length){
      const todayTotals=new Map();
      todayRecords.forEach(item=>todayTotals.set(item.category,(todayTotals.get(item.category)||0)+n(item.amount)));
      const top=strongestCategory(todayTotals);
      if(top){
        const total=expenseTotal(todayRecords);
        const share=total>0?top[1]/total*100:0;
        title=`${top[0]} accounts for most of today’s recorded spending.`;
        summary=`${fmt.format(top[1])}—about ${share.toFixed(0)}% of today’s total—is in ${top[0].toLowerCase()}.`;
        reason='Daily observations describe today’s composition only. WealthOS does not treat one day as a lasting habit.';
      }
    }
  }

  if(period==='weekly'){
    const weekRecords=expensesForPeriod(data,'weekly');
    if(weekRecords.length>=2){
      const weekTotals=new Map();
      weekRecords.forEach(item=>weekTotals.set(item.category,(weekTotals.get(item.category)||0)+n(item.amount)));
      const top=strongestCategory(weekTotals);
      if(top){
        const weekTotal=expenseTotal(weekRecords);
        const share=weekTotal>0?top[1]/weekTotal*100:0;
        title=`${top[0]} is this week’s largest recorded category.`;
        summary=`It represents ${share.toFixed(0)}% of the spending you recorded this week.`;
        reason=`WealthOS calculated this from ${weekRecords.length} Quick Add records in the current week.`;
      }
    }
  }

  return {title,summary,reason};
}

function renderSnapshotInsight(data,fmt,period){
  const observation=buildObservation(data,fmt,period);
  $('snapshotInsightTitle').textContent=observation.title;
  $('snapshotInsightSummary').textContent=observation.summary;
  $('snapshotInsightReason').textContent=observation.reason;
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
    : closingObservation.reason;
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
    if(saved>0&&data.challenge.enabled&&n(data.challenge.target)>0){
      data.challenge.saved=Math.min(n(data.challenge.target),n(data.challenge.saved)+saved);
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
function openContribution(){
  const data=loadData();
  const hasChallenge=data.challenge.enabled&&n(data.challenge.target)>0;
  $('contributionTitle').textContent=hasChallenge?'Record a contribution':'Update your emergency fund';
  $('contributionHelp').textContent=hasChallenge
    ? `This will update your ${data.challenge.name||'Savings'} challenge.`
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
  if(data.challenge.enabled&&n(data.challenge.target)>0){
    data.challenge.saved=Math.min(n(data.challenge.target),n(data.challenge.saved)+amount);
  }else{
    data.emergency.balance=n(data.emergency.balance)+amount;
  }
  data.checkins.push({id:Date.now(),type:'contribution',date:new Date().toISOString().slice(0,10),amount});
  saveData(data);
  closeContribution();
  render(data);
  location.hash='focus';
}
function routeNextAction(){
  const data=loadData();
  const te=n(data.taxes.estimate),tr=n(data.taxes.reserved),short=Math.max(0,te-tr);
  const ess=n(data.emergency.essentials),complete=ess>0&&n(data.emergency.balance)>=ess*n(data.emergency.targetMonths,6);
  if(te>0&&short>0){openAboutSection('Quarterly taxes');return}
  if(ess>0&&!complete){openAboutSection('Emergency fund');return}
  if(data.challenge.enabled&&n(data.challenge.target)>n(data.challenge.saved)){openContribution();return}
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
  if(data.challenge.enabled&&n(data.challenge.target)>n(data.challenge.saved)){
    return {
      title:'Continue your savings goal.',
      text:'Your monthly check-in is complete. One contribution can keep the goal moving.',
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
  d.onboardingComplete=true;d.profile={name:$('nameInput').value.trim(),currency:$('currencyInput').value};d.income={source:$('incomeSourceName').value.trim()||'Income',currentMonth:newMonth,current:n($('incomeCurrent').value)};d.taxes={dueDate:$('taxDueDate').value,estimate:n($('taxEstimate').value),reserved:n($('taxReserved').value)};d.emergency={balance:n($('emergencyBalance').value),essentials:n($('essentialExpenses').value),targetMonths:n($('targetMonths').value,6),monthlyContribution:n($('emergencyContribution').value)};d.challenge={enabled:$('challengeEnabled').checked,name:$('challengeName').value.trim(),target:n($('challengeTarget').value),saved:n($('challengeSaved').value),startDate:$('challengeStart').value,durationWeeks:n($('challengeDuration').value,12),frequency:$('challengeFrequency').value};return d;
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
  e.preventDefault();const d=blankData();d.onboardingComplete=true;d.profile={name:$('onboardingName').value.trim(),currency:$('onboardingCurrency').value};d.income={source:$('onboardingIncomeSource').value.trim()||'Total income',currentMonth:$('onboardingIncomeMonth').value||nowMonth,current:n($('onboardingIncomeAmount').value)};const yes=document.querySelector('input[name="challengeChoice"]:checked').value==='yes';d.challenge.enabled=yes;if(yes){d.challenge.name=$('onboardingChallengeName').value.trim()||'Savings';d.challenge.target=n($('onboardingChallengeTarget').value);d.challenge.startDate=new Date().toISOString().slice(0,10)}saveData(d);closeOnboarding();render(d);location.hash='focus';
};
$('aboutTrigger').onclick=()=>{$('aboutPanel').classList.add('open');$('panelBackdrop').hidden=false};$('closePanel').onclick=()=>{$('aboutPanel').classList.remove('open');$('panelBackdrop').hidden=true};$('panelBackdrop').onclick=$('closePanel').onclick;
$('challengeEnabled').onchange=toggleChallenge;$('aboutForm').onsubmit=e=>{e.preventDefault();const d=readAbout();saveData(d);render(d);$('closePanel').click()};
$('clearPreviewButton').onclick=()=>{if(confirm('Start fresh on this browser? This removes the saved Private Preview data.')){localStorage.removeItem(STORAGE_KEY);for(const k of LEGACY_KEYS)localStorage.removeItem(k);$('closePanel').click();render(blankData());location.hash='lobby'}};
document.querySelectorAll('.signal-button').forEach(b=>b.onclick=()=>{const card=b.closest('.signal-card'),open=card.classList.toggle('open');b.setAttribute('aria-expanded',String(open))});
document.querySelectorAll('.period-button').forEach(button=>button.addEventListener('click',()=>{const data=loadData();renderSnapshot(data,money(data.profile.currency),button.dataset.period)}));
$('workspaceFocusAction').addEventListener('click',()=>performWorkspaceAction($('workspaceFocusAction').dataset.action));
$('workspaceContinueAction').addEventListener('click',()=>performWorkspaceAction($('workspaceContinueAction').dataset.action));
$('workspaceQuickAdd').addEventListener('click',openQuickAdd);
$('quickAddTrigger').addEventListener('click',openQuickAdd);
$('addAnotherExpense').addEventListener('click',openQuickAdd);
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
  if(period==='daily'){openQuickAdd();return}
  if(period==='weekly'){const data=loadData();if(expensesForPeriod(data,'weekly').length){openQuickAdd();return}openCheckin('weekly');return}
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
