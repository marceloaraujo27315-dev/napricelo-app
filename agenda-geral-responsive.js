(function(){
  const st=document.createElement('style');
  st.textContent=`
  #agenda-geral{max-width:1180px;margin:0 auto;padding-left:18px;padding-right:18px}
  #agendaGeralLista{width:100%}
  .ag-cal-head{gap:12px;flex-wrap:wrap}
  .ag-semana,.ag-calendario{width:100%;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}
  .ag-dia{min-height:112px;padding:7px}
  .ag-evento{font-size:11px;padding:6px 7px}
  @media(min-width:1100px){
    #agenda-geral{max-width:1240px}
    .ag-dia{min-height:118px}
    .ag-evento{font-size:11px}
  }
  @media(max-width:900px){
    #agenda-geral{padding-left:12px;padding-right:12px}
    .ag-dia{min-height:96px;padding:5px}
    .ag-evento{font-size:10px;padding:5px}
  }
  @media(max-width:700px){
    #agendaGeralLista{overflow-x:auto;padding-bottom:8px}
    .ag-semana,.ag-calendario{min-width:700px;grid-template-columns:repeat(7,95px)}
    .ag-dia{min-height:104px}
  }
  `;
  document.head.appendChild(st);
})();