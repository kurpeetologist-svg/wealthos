
const STORAGE_KEY='wealthos-v0.8-data';
const currencies=['AED','AFN','ALL','AMD','ANG','AOA','ARS','AUD','AWG','AZN','BAM','BBD','BDT','BGN','BHD','BIF','BMD','BND','BOB','BRL','BSD','BTN','BWP','BYN','BZD','CAD','CDF','CHF','CLP','CNY','COP','CRC','CUP','CVE','CZK','DJF','DKK','DOP','DZD','EGP','ERN','ETB','EUR','FJD','FKP','GBP','GEL','GHS','GIP','GMD','GNF','GTQ','GYD','HKD','HNL','HRK','HTG','HUF','IDR','ILS','INR','IQD','IRR','ISK','JMD','JOD','JPY','KES','KGS','KHR','KMF','KPW','KRW','KWD','KYD','KZT','LAK','LBP','LKR','LRD','LSL','LYD','MAD','MDL','MGA','MKD','MMK','MNT','MOP','MRU','MUR','MVR','MWK','MXN','MYR','MZN','NAD','NGN','NIO','NOK','NPR','NZD','OMR','PAB','PEN','PGK','PHP','PKR','PLN','PYG','QAR','RON','RSD','RUB','RWF','SAR','SBD','SCR','SDG','SEK','SGD','SHP','SLE','SOS','SRD','SSP','STN','SYP','SZL','THB','TJS','TMT','TND','TOP','TRY','TTD','TWD','TZS','UAH','UGX','USD','UYU','UZS','VES','VND','VUV','WST','XAF','XCD','XOF','XPF','YER','ZAR','ZMW','ZWL'];
const nowMonth=new Date().toISOString().slice(0,7);
const defaults={
 profile:{name:'Kurt',currency:'USD'},
 income:{source:'Total income',currentMonth:nowMonth,current:9240},
 incomeHistory:[
  {month:'2026-04',amount:6800},{month:'2026-05',amount:7100},{month:'2026-06',amount:7277}
 ],
 taxes:{dueDate:'2026-07-21',estimate:2480,reserved:2480},
 emergency:{balance:24300,essentials:4050,targetMonths:6,monthlyContribution:500},
 challenge:{enabled:true,name:'Philippines trip',target:1200,saved:600,startDate:'2026-06-01',durationWeeks:12,frequency:'weekly'}
};
const cloneDefaults=()=>JSON.parse(JSON.stringify(defaults));
function loadData(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||cloneDefaults()}catch{return cloneDefaults()}}
function saveData(d){localStorage.setItem(STORAGE_KEY,JSON.stringify(d))}
function moneyFormatter(code){try{return new Intl.NumberFormat(undefined,{style:'currency',currency:code,maximumFractionDigits:0})}catch{return new Intl.NumberFormat(undefined,{maximumFractionDigits:0})}}
function formatMonth(m){if(!m)return'Unknown month';const [y,mo]=m.split('-');return new Intl.DateTimeFormat(undefined,{month:'long',year:'numeric'}).format(new Date(Number(y),Number(mo)-1,1))}
function formatDate(s){if(!s)return'No date set';return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(s+'T12:00:00'))}
function daysUntil(s){if(!s)return null;const n=new Date();n.setHours(0,0,0,0);return Math.ceil((new Date(s+'T00:00:00')-n)/86400000)}
function sortedHistory(d){
 const merged=[...(d.incomeHistory||[])].filter(x=>x.month!==d.income.currentMonth);
 merged.push({month:d.income.currentMonth,amount:Number(d.income.current)||0});
 return merged.sort((a,b)=>a.month.localeCompare(b.month));
}
function trendStats(history){
 const current=history.at(-1)||{amount:0};const previous=history.at(-2)||null;
 const prior=history.slice(0,-1);const priorHigh=prior.length?Math.max(...prior.map(x=>Number(x.amount)||0)):null;
 let streak=1;
 for(let i=history.length-1;i>0;i--){if(Number(history[i].amount)>Number(history[i-1].amount))streak++;else break}
 const avg=history.length?history.reduce((s,x)=>s+Number(x.amount||0),0)/history.length:0;
 return {current,previous,priorHigh,isRecord:priorHigh!==null&&Number(current.amount)>priorHigh,streak,avg};
}
function updateGreeting(name){const h=new Date().getHours();const p=h<12?'Good morning':h<18?'Good afternoon':'Good evening';greeting.textContent=`${p}, ${name}.`;todayDate.textContent=new Intl.DateTimeFormat(undefined,{weekday:'long',month:'long',day:'numeric'}).format(new Date())}
function contributionPeriods(w,f){return f==='weekly'?Math.max(1,w):f==='biweekly'?Math.max(1,Math.ceil(w/2)):Math.max(1,Math.ceil(w/4.345))}
function challengeElapsedWeeks(s){if(!s)return 0;const n=new Date();n.setHours(0,0,0,0);return Math.max(0,Math.floor((n-new Date(s+'T00:00:00'))/604800000))}
function buildNextStep(d,c,m){
 if(c.taxOverdue)return{title:'Review your overdue tax payment',value:`${Math.abs(c.taxDays)} days`,change:'Past the selected due date',personal:'This deserves your attention before any optional allocation.',why:`The due date passed on ${formatDate(d.taxes.dueDate)}.`,changes:'Resolving it removes the most time-sensitive obligation in your current financial picture.',move:'Confirm whether the payment was made or schedule it today.'};
 if(c.taxShortfall>0&&c.taxDays!==null&&c.taxDays<=30)return{title:'Complete your tax reserve',value:m.format(c.taxShortfall),change:`Due in ${Math.max(0,c.taxDays)} days`,personal:'This is the clearest financial priority based on your current information.',why:`Your estimate is ${m.format(c.taxEstimate)}, but you have reserved ${m.format(c.taxReserved)}.`,changes:'Closing the gap prevents the payment from drawing on general cash.',move:`Move ${m.format(c.taxShortfall)} into your tax reserve before ${formatDate(d.taxes.dueDate)}.`};
 if(!c.emergencyComplete){const a=Math.min(c.emergencyRemaining,Math.max(0,Number(d.emergency.monthlyContribution)||0))||c.emergencyRemaining;return{title:'Continue building your emergency fund',value:m.format(a),change:`${c.monthsCovered.toFixed(1)} of ${c.targetMonths} months covered`,personal:'Your emergency fund remains the strongest next foundation to complete.',why:`You are ${m.format(c.emergencyRemaining)} away from your selected target.`,changes:`A ${m.format(a)} contribution moves you closer without changing the goal.`,move:`Set aside ${m.format(a)} during your next contribution cycle.`}}
 if(d.challenge.enabled&&c.challengeRemaining>0)return{title:`Continue your ${d.challenge.name} challenge`,value:m.format(c.challengeContribution),change:`${c.challengePercent}% complete`,personal:'Your safety net is complete, so this goal can take the next available contribution.',why:`You have ${m.format(c.challengeRemaining)} remaining across approximately ${c.challengePeriodsRemaining} contribution periods.`,changes:`Staying at ${m.format(c.challengeContribution)} per ${d.challenge.frequency==='monthly'?'month':d.challenge.frequency==='biweekly'?'two weeks':'week'} keeps the challenge aligned with its duration.`,move:`Make the next ${m.format(c.challengeContribution)} contribution toward ${d.challenge.name}.`}
 return{title:'No financial action is required today',value:'On track',change:'Review again when something changes',personal:'Your selected obligations and goals are currently funded or complete.',why:'Your tax reserve is funded, your emergency fund is complete, and no active Savings Challenge needs a contribution.',changes:'Maintaining the current position protects the progress you have already made.',move:'Return when new income, deadlines, or goals are available.'}
}
function render(d){
 const m=moneyFormatter(d.profile.currency);updateGreeting(d.profile.name);
 const history=sortedHistory(d),stats=trendStats(history),current=Number(stats.current.amount||0),previous=stats.previous?Number(stats.previous.amount||0):null,delta=previous===null?null:current-previous,pct=previous>0?(delta/previous)*100:null,source=d.income.source||'Income';
 growthValue.textContent=m.format(current);
 if(stats.isRecord){growthTitle.textContent=`${source} reached a new monthly high`;growthPersonal.textContent=`This is your strongest ${source.toLowerCase()} month since you started WealthOS.`}
 else{growthTitle.textContent=delta>0?`${source} increased this month`:delta<0?`${source} decreased this month`:`${source} held steady this month`;growthPersonal.textContent=delta===null?'This is the first month in your WealthOS history.':`Your ${source.toLowerCase()} is ${m.format(Math.abs(delta))} ${delta>=0?'higher':'lower'} than last month.`}
 growthChange.textContent=pct===null?'Your first recorded month':`${delta>=0?'+':''}${pct.toFixed(0)}% vs last month`;
 growthStoryChanged.textContent=stats.previous?`Your ${source.toLowerCase()} moved from ${m.format(previous)} in ${formatMonth(stats.previous.month)} to ${m.format(current)} in ${formatMonth(stats.current.month)}.`:`You recorded ${m.format(current)} for ${formatMonth(stats.current.month)}.`;
 growthStoryMatters.textContent=stats.streak>=3?`Your ${source.toLowerCase()} has grown for ${stats.streak} consecutive months.`:stats.isRecord?'You moved beyond every earlier month stored in WealthOS.':`Your recorded monthly average is ${m.format(stats.avg)}.`;
 growthStoryNext.textContent=delta!==null&&delta>0?'Choose how much of this increase should support taxes, savings, or your active challenge.':'Keep recording each month so WealthOS can distinguish a pattern from a one-month change.';
 reflection.textContent=stats.streak>=3?`Consistency is becoming a pattern.`:stats.isRecord?'A new record deserves a quiet moment.':'Quiet months build strong years.';

 const taxDays=daysUntil(d.taxes.dueDate),taxEstimate=Number(d.taxes.estimate)||0,taxReserved=Number(d.taxes.reserved)||0,taxShortfall=Math.max(0,taxEstimate-taxReserved),taxFunded=taxReserved>=taxEstimate,taxOverdue=taxDays!==null&&taxDays<0;
 attentionTitle.textContent=taxOverdue?'Your quarterly tax payment may be overdue':taxFunded?'Your quarterly tax payment is fully reserved':'Your quarterly tax reserve needs attention';
 attentionValue.textContent=taxDays===null?'No date':taxOverdue?`${Math.abs(taxDays)} days late`:`${taxDays} days`;
 attentionChange.textContent=taxFunded?`${m.format(taxReserved)} reserved`:`${m.format(taxShortfall)} still needed`;
 attentionPersonal.textContent=taxOverdue?'Review whether this payment has already been completed.':taxFunded?'You have set aside the full estimated amount.':'Your reserve is not yet fully funded.';
 attentionStoryChanged.textContent=`Your estimated payment is ${m.format(taxEstimate)} and the selected due date is ${formatDate(d.taxes.dueDate)}.`;
 attentionStoryMatters.textContent=taxFunded?'The payment should not interrupt your normal cash flow.':'Closing the gap reduces the chance of using general cash for taxes.';
 attentionStoryNext.textContent=taxOverdue?'Confirm the payment status today.':taxFunded?'Keep the reserve untouched until the payment clears.':`Add ${m.format(taxShortfall)} before the due date.`;

 const eb=Number(d.emergency.balance)||0,ess=Math.max(1,Number(d.emergency.essentials)||1),tm=Math.max(1,Number(d.emergency.targetMonths)||1),ta=ess*tm,mc=eb/ess,er=Math.max(0,ta-eb),ec=eb>=ta;
 const ct=Number(d.challenge.target)||0,cs=Number(d.challenge.saved)||0,cr=Math.max(0,ct-cs),cp=ct>0?Math.min(100,Math.round(cs/ct*100)):0,tp=contributionPeriods(Number(d.challenge.durationWeeks)||1,d.challenge.frequency),ew=challengeElapsedWeeks(d.challenge.startDate),ep=d.challenge.frequency==='weekly'?ew:d.challenge.frequency==='biweekly'?Math.floor(ew/2):Math.floor(ew/4.345),pr=Math.max(1,tp-ep),cc=cr>0?cr/pr:0;
 if(d.challenge.enabled&&ct>0){
  progressTitle.textContent=cr<=0?`Your ${d.challenge.name} challenge is complete`:`Your ${d.challenge.name} challenge is moving forward`;
  progressValue.textContent=m.format(cs);progressChange.textContent=`${cp}% of ${m.format(ct)} saved`;progressPersonal.textContent=cr<=0?'You reached the full target you set for yourself.':`You have ${m.format(cr)} remaining.`;
  progressStoryChanged.textContent=`You have saved ${m.format(cs)} toward ${d.challenge.name}.`;progressStoryMatters.textContent=cr<=0?'The goal is complete and ready for its intended purpose.':`Your current pace calls for roughly ${m.format(cc)} per ${d.challenge.frequency==='monthly'?'month':d.challenge.frequency==='biweekly'?'two weeks':'week'}.`;progressStoryNext.textContent=cr<=0?'Decide whether to close the challenge or begin a new one.':`Make the next ${m.format(cc)} contribution.`;
 } else {
  progressTitle.textContent=ec?'Your emergency fund is complete':'Your emergency fund is still building';progressValue.textContent=m.format(eb);progressChange.textContent=`${mc.toFixed(1)} months of expenses covered`;progressPersonal.textContent=ec?`You reached your ${tm}-month target.`:`You are ${m.format(er)} away from your target.`;
  progressStoryChanged.textContent=`Your current balance covers approximately ${mc.toFixed(1)} months of essential expenses.`;progressStoryMatters.textContent=ec?'Your financial safety net has reached the level you selected.':'Each contribution increases the time you could absorb an income disruption.';progressStoryNext.textContent=ec?'Choose where future contributions should go next.':`Continue until the remaining ${m.format(er)} is complete.`;
 }
 const calc={taxDays,taxEstimate,taxReserved,taxShortfall,taxFunded,taxOverdue,monthsCovered:mc,targetMonths:tm,emergencyRemaining:er,emergencyComplete:ec,challengeRemaining:cr,challengePercent:cp,challengeContribution:cc,challengePeriodsRemaining:pr};
 const step=buildNextStep(d,calc,m);nextTitle.textContent=step.title;nextValue.textContent=step.value;nextChange.textContent=step.change;nextPersonal.textContent=step.personal;nextStoryWhy.textContent=step.why;nextStoryChanges.textContent=step.changes;nextStoryMove.textContent=step.move;
 const attentionNeeded=taxOverdue||taxShortfall>0||!ec;financialState.textContent=(delta===null||delta>=0||ec)?'Your financial life is moving in the right direction.':'Your financial life is steady, with room to rebuild momentum.';attentionState.textContent=attentionNeeded?'There is one thing worth reviewing today.':'Nothing requires your attention today.';
 renderHistory(history,stats,m,source);populateForm(d);
}
function renderHistory(history,stats,m,source){
 historySummary.textContent=history.length<2?'Add another month to unlock comparisons.':`${history.length} months remembered · ${m.format(stats.avg)} monthly average`;
 historyList.innerHTML='';
 history.slice().reverse().slice(0,6).forEach((x,i)=>{
  const prev=history[history.findIndex(h=>h.month===x.month)-1];
  const diff=prev?Number(x.amount)-Number(prev.amount):null;
  const card=document.createElement('article');card.className='history-card';
  const title=i===0&&stats.isRecord?`Your strongest ${source.toLowerCase()} month yet`:diff===null?'The month your history began':diff>0?`${source} moved forward`:diff<0?`${source} softened`:`${source} remained steady`;
  card.innerHTML=`<time>${formatMonth(x.month)}</time><h3>${title}</h3><p>${m.format(Number(x.amount)||0)}${diff===null?'':` · ${diff>=0?'+':''}${m.format(diff)} vs prior month`}</p>`;
  historyList.appendChild(card);
 });
}
function populateCurrencyOptions(selected){currencyInput.innerHTML='';currencies.forEach(code=>{const o=document.createElement('option');o.value=code;let label=code;try{label=`${code} — ${new Intl.DisplayNames([navigator.language||'en'],{type:'currency'}).of(code)}`}catch{}o.textContent=label;o.selected=code===selected;currencyInput.appendChild(o)})}
function populateForm(d){
 populateCurrencyOptions(d.profile.currency);nameInput.value=d.profile.name;incomeSourceName.value=d.income.source;incomeMonth.value=d.income.currentMonth||nowMonth;incomeCurrent.value=d.income.current;taxDueDate.value=d.taxes.dueDate;taxEstimate.value=d.taxes.estimate;taxReserved.value=d.taxes.reserved;emergencyBalance.value=d.emergency.balance;essentialExpenses.value=d.emergency.essentials;targetMonths.value=d.emergency.targetMonths;emergencyContribution.value=d.emergency.monthlyContribution;challengeEnabled.checked=d.challenge.enabled;challengeName.value=d.challenge.name;challengeTarget.value=d.challenge.target;challengeSaved.value=d.challenge.saved;challengeStart.value=d.challenge.startDate;challengeDuration.value=String(d.challenge.durationWeeks);challengeFrequency.value=d.challenge.frequency;toggleChallengeFields();renderHistoryManager(d);
}
function renderHistoryManager(d){
 historyManagerList.innerHTML='';(d.incomeHistory||[]).sort((a,b)=>b.month.localeCompare(a.month)).forEach(x=>{const row=document.createElement('div');row.className='history-manager-row';row.innerHTML=`<span>${formatMonth(x.month)}</span><strong>${moneyFormatter(d.profile.currency).format(Number(x.amount)||0)}</strong><button class="delete-history" type="button" data-month="${x.month}">Remove</button>`;historyManagerList.appendChild(row)});
 historyManagerList.querySelectorAll('.delete-history').forEach(b=>b.addEventListener('click',()=>{const d=loadData();d.incomeHistory=(d.incomeHistory||[]).filter(x=>x.month!==b.dataset.month);saveData(d);render(d)}));
}
function readForm(){
 const d=loadData(),month=incomeMonth.value||nowMonth,amount=Number(incomeCurrent.value)||0;
 d.incomeHistory=(d.incomeHistory||[]).filter(x=>x.month!==month);
 if(month!==d.income.currentMonth)d.incomeHistory=d.incomeHistory.filter(x=>x.month!==d.income.currentMonth);
 d.profile={name:nameInput.value.trim()||'You',currency:currencyInput.value};
 d.income={source:incomeSourceName.value.trim()||'Income',currentMonth:month,current:amount};
 d.taxes={dueDate:taxDueDate.value,estimate:Number(taxEstimate.value)||0,reserved:Number(taxReserved.value)||0};
 d.emergency={balance:Number(emergencyBalance.value)||0,essentials:Number(essentialExpenses.value)||1,targetMonths:Number(targetMonths.value)||1,monthlyContribution:Number(emergencyContribution.value)||0};
 d.challenge={enabled:challengeEnabled.checked,name:challengeName.value.trim()||'Savings',target:Number(challengeTarget.value)||0,saved:Number(challengeSaved.value)||0,startDate:challengeStart.value,durationWeeks:Number(challengeDuration.value)||12,frequency:challengeFrequency.value};
 return d;
}
function toggleChallengeFields(){const e=challengeEnabled.checked;challengeFields.style.opacity=e?'1':'.45';challengeFields.querySelectorAll('input,select').forEach(x=>x.disabled=!e)}
const panel=aboutPanel,backdrop=panelBackdrop;
function openPanel(){panel.classList.add('open');panel.setAttribute('aria-hidden','false');backdrop.hidden=false}
function closePanel(){panel.classList.remove('open');panel.setAttribute('aria-hidden','true');backdrop.hidden=true}
aboutTrigger.addEventListener('click',openPanel);closePanel.addEventListener('click',closePanel);backdrop.addEventListener('click',closePanel);challengeEnabled.addEventListener('change',toggleChallengeFields);
aboutForm.addEventListener('submit',e=>{e.preventDefault();const d=readForm();saveData(d);render(d);closePanel()});
resetButton.addEventListener('click',()=>{const d=cloneDefaults();saveData(d);render(d)});
document.querySelectorAll('.signal-button').forEach(b=>b.addEventListener('click',()=>{const c=b.closest('.signal-card'),o=c.classList.contains('open');document.querySelectorAll('.signal-card.open').forEach(x=>{if(x!==c){x.classList.remove('open');x.querySelector('.signal-button').setAttribute('aria-expanded','false')}});c.classList.toggle('open',!o);b.setAttribute('aria-expanded',String(!o))}));
render(loadData());
