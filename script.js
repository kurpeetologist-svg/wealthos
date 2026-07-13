
'use strict';

const STORAGE_KEY='wealthos-v0.11.0-data';
const LEGACY_KEYS=['wealthos-v0.10.1-data','wealthos-v0.10.0-data','wealthos-v0.9.4-data','wealthos-v0.9.3-data','wealthos-v0.9.2.1-data','wealthos-v0.9.2-data','wealthos-v0.9.1-data','wealthos-v0.9-data','wealthos-v0.8-data','wealthos-v0.7-data','wealthos-v0.6-data'];
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
  checkins:[]
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
  d.checkins=Array.isArray(raw.checkins)?raw.checkins:[];
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
  $('firstVisitFocus').hidden=isReturning;$('financialLedger').hidden=!isReturning;$('signalGrid').hidden=!isReturning;$('continueExploring').hidden=!isReturning;
  $('firstVisitCheckin').hidden=isReturning;$('returningCheckin').hidden=!isReturning;$('connectionChoice').hidden=!isReturning;
  $('firstVisitTimeline').hidden=isReturning;$('timelineGroups').hidden=!isReturning;
  $('firstVisitSnapshot').hidden=isReturning;$('returningSnapshot').hidden=!isReturning;
  $('aboutTrigger').hidden=!isReturning;
  $('focusIntro').textContent=isReturning?'Four Signals to help you understand what matters today.':"We'll surface the four most important things to know after your first check-in.";
}

const lessons=[
  {
    category:'Saving',
    title:'An emergency fund is not about expecting the worst.',
    summary:'It is about giving yourself more choices when life changes.',
    why:'Cash set aside for emergencies can reduce the need to rely on debt or make rushed decisions when an unexpected expense appears.',
    keep:'The right target is personal. Start with an amount that feels achievable, then build from there.'
  },
  {
    category:'Investing',
    title:'Time can matter more than finding the perfect investment.',
    summary:'Starting consistently gives compounding more time to work.',
    why:'Investment growth can build on earlier growth over long periods. Waiting for a perfect moment can mean losing valuable time.',
    keep:'Investing involves risk. A diversified approach and a long-term view may help, but choices should fit your goals and circumstances.'
  },
  {
    category:'Spending',
    title:'A spending total becomes useful when it has context.',
    summary:'The same amount can mean very different things depending on income, obligations, and priorities.',
    why:'Comparing spending with income and personal goals provides more meaning than labeling a purchase good or bad.',
    keep:'A Snapshot is meant to create awareness—not guilt. One week does not define your habits.'
  },
  {
    category:'Saving',
    title:'Small automatic transfers can turn intention into a habit.',
    summary:'Consistency often matters more than beginning with a large amount.',
    why:'Moving money regularly reduces the number of times you need to make the same saving decision.',
    keep:'Choose an amount that leaves enough room for essential expenses and adjust it when your circumstances change.'
  },
  {
    category:'Debt',
    title:'The minimum payment keeps an account current, but it may not reduce debt quickly.',
    summary:'Paying more than the minimum can reduce the time and interest needed to repay a balance.',
    why:'Interest may continue accumulating while a balance remains. Additional principal payments can shorten the repayment period.',
    keep:'Always protect essential expenses first, and review the specific terms and interest rate of each debt.'
  },
  {
    category:'Income',
    title:'A raise does not have to become a full lifestyle upgrade.',
    summary:'Saving part of every increase can support both present comfort and future goals.',
    why:'Lifestyle expenses can quietly expand to absorb higher income, leaving long-term progress unchanged.',
    keep:'Enjoying part of an increase is reasonable. The lesson is to choose the allocation intentionally.'
  },
  {
    category:'Planning',
    title:'A financial goal becomes clearer when it has an amount and a timeframe.',
    summary:'Specific goals make it easier to understand the next manageable contribution.',
    why:'A defined target can be divided into smaller weekly or monthly actions instead of remaining an abstract intention.',
    keep:'Timelines can change. Adjusting a goal is part of planning—not a sign of failure.'
  },
  {
    category:'Spending',
    title:'Recurring expenses deserve occasional attention because they are easy to stop noticing.',
    summary:'A small monthly charge can become meaningful when repeated over a year.',
    why:'Subscriptions and recurring services continue without requiring a new decision each month.',
    keep:'The goal is not to cancel everything. Keep what provides enough value and reconsider what no longer does.'
  },
  {
    category:'Credit',
    title:'Credit utilization is a snapshot, not a measure of your worth.',
    summary:'Lower reported balances may support credit health, but they do not define financial success.',
    why:'Credit scoring models often consider how much revolving credit is being used relative to available limits.',
    keep:'Credit factors vary by scoring model. Paying on time and avoiding unaffordable debt remain important foundations.'
  },
  {
    category:'Financial Confidence',
    title:'Knowing where you stand is already a financial action.',
    summary:'Clarity makes the next decision easier, even when nothing changes immediately.',
    why:'Avoiding financial information can increase uncertainty. A brief check-in turns the unknown into something understandable.',
    keep:'You do not need to solve everything today. One honest check-in is enough for this moment.'
  }
];

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
function render(data){
  greeting();
  renderLesson();
  const returning=hasMeaningfulData(data);
  showState(returning);
  if(!returning)return;
  const fmt=money(data.profile.currency),h=sortedHistory(data),s=stats(h),cur=n(s.cur.amount),prev=s.prev?n(s.prev.amount):null,delta=prev===null?null:cur-prev,pct=prev>0?delta/prev*100:null,source=data.income.source||'Income';
  renderFinancialLedger(data,fmt);
  $('incomeSlipMonth').textContent=formatMonth(data.income.currentMonth);
  $('incomeSlipSource').textContent=source;
  $('incomeSlipAmount').textContent=fmt.format(cur);
  $('incomeSlipDelta').textContent=delta===null?'First record':`${delta>=0?'+':'−'}${fmt.format(Math.abs(delta))}`;
  ['growthCurrency','attentionCurrency','progressCurrency','nextCurrency'].forEach(id=>$(id).textContent=data.profile.currency);
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
  renderSnapshot(data,fmt,'weekly');
  populateAbout(data);
}
function timelineEvent(title,description,amount){
  const a=document.createElement('article');a.className='timeline-event';
  const b=document.createElement('button');b.className='timeline-event-button';b.type='button';b.setAttribute('aria-expanded','false');
  const marker=document.createElement('span');marker.className='timeline-marker';
  const copy=document.createElement('div');copy.className='timeline-copy';copy.innerHTML=`<h4>${title}</h4><p>${description}</p><span class="story-tone">Reflection</span>`;
  const val=document.createElement('div');val.className='timeline-amount';val.textContent=amount;
  const action=document.createElement('span');action.className='timeline-event-action';action.innerHTML='<span>Read story</span><b>+</b>';
  b.append(marker,copy,val,action);
  const story=document.createElement('div');story.className='timeline-story';story.innerHTML=`<div class="timeline-story-inner"><div class="timeline-story-block"><span>What happened</span><p>${description}</p></div><div class="timeline-story-block"><span>Why it matters</span><p>This chapter becomes part of the context WealthOS uses to help you understand future changes.</p></div></div>`;
  a.append(b,story);b.onclick=()=>{const open=a.classList.toggle('open');b.setAttribute('aria-expanded',String(open))};return a;
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
    events.append(timelineEvent(title,description,amount));
  });
}
function renderSnapshot(data,fmt,period){
  const labels={daily:'Today',weekly:'This week',monthly:'This month'};
  const values={daily:n(data.spending?.daily),weekly:n(data.spending?.weekly),monthly:n(data.spending?.monthly)};
  const amount=values[period]||0;
  const monthlyIncome=n(data.income?.current);
  let monthlyEquivalent=amount;
  if(period==='daily')monthlyEquivalent=amount*30;
  if(period==='weekly')monthlyEquivalent=amount*4.345;
  $('snapshotPeriod').textContent=labels[period];
  $('snapshotValue').textContent=fmt.format(amount);
  if(monthlyIncome>0){
    const percent=(period==='monthly'?amount:monthlyEquivalent)/monthlyIncome*100;
    $('snapshotContext').textContent=period==='monthly'
      ? `${percent.toFixed(0)}% of this month's income has been spent.`
      : `At this pace, spending equals about ${percent.toFixed(0)}% of monthly income.`;
  }else{
    $('snapshotContext').textContent='Add monthly income to place this spending in context.';
  }
  $('snapshotSelectedAmount').textContent=fmt.format(amount);
  $('snapshotMonthlyPace').textContent=fmt.format(monthlyEquivalent);
  $('snapshotAnnualPace').textContent=fmt.format(monthlyEquivalent*12);
  $('receiptRecorded').textContent=fmt.format(amount);
  $('receiptIncomeShare').textContent=monthlyIncome>0?`${(((period==='monthly'?amount:monthlyEquivalent)/monthlyIncome)*100).toFixed(0)}%`:'—';
  $('receiptPace').textContent=fmt.format(monthlyEquivalent);
  $('snapshotNote').textContent=amount===0
    ? 'Your Snapshot is ready for its first spending check-in. Add an approximate total whenever you are ready.'
    : 'This is a snapshot, not a judgment. Time horizons show how a repeated spending pattern could affect the larger picture.';
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
    data.checkins.push({id:Date.now(),type,date,spent,note});
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
    data.checkins.push({id:Date.now(),type,date,income,spent,saved,note});
  }

  data.onboardingComplete=true;
  saveData(data);
  closeCheckin();
  render(data);
  location.hash='spendingSnapshot';
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
