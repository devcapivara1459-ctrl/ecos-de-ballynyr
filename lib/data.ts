import 'server-only';
export const characters = [
{id:'rhiona',name:'Rhiona Mac Tuirenn',tag:'O legado da forja',text:'Você carrega o peso de um legado e a coragem de construir aquilo que protege os seus.'},
{id:'rowan',name:'Rowan Lobo Castanho',tag:'O guardião dos ermos',text:'Entre rastros e silêncio, sua lealdade fala mais alto do que qualquer promessa.'},
{id:'muirenn',name:'Muirenn da Lua Pálida',tag:'A guardiã do bosque',text:'Onde outros enxergam estranheza, você reconhece vida, memória e cuidado.'},
{id:'cavan',name:'Irmão Cavan',tag:'O peso do conhecimento',text:'Entre o dever e o coração, você encontra caminhos por meio do saber.'},
{id:'malik',name:'Malik ibn Qamar',tag:'O viajante dos mistérios',text:'O horizonte é apenas o começo de suas perguntas.'},
{id:'sira',name:'Sira Cissé',tag:'A vontade de ser livre',text:'Você conhece o preço da liberdade e sabe sobreviver a tempestades.'}
] as const;
// Cada resposta pontua dois perfis; pesos podem ser ajustados pelo mestre.
export const questions = [
{q:'Uma trilha desapareceu sob a névoa. O que você faz?',a:[['Procuro marcas de passagem.','rowan','muirenn'],['Reúno todos e preparo um caminho seguro.','rhiona','cavan'],['Examino sinais e relatos antigos.','cavan','malik'],['Avanço para descobrir o que há adiante.','sira','malik']]},
{q:'Um estranho chega à vila sem revelar de onde veio.',a:[['Ofereço ajuda antes de perguntar.','muirenn','cavan'],['Observo discretamente seus movimentos.','rowan','sira'],['Pergunto pelas terras que conheceu.','malik','cavan'],['Quero saber se representa algum perigo.','rhiona','sira']]},
{q:'Uma ferramenta importante se quebra na véspera da colheita.',a:[['Tento consertá-la com o que tenho.','rhiona','cavan'],['Procuro outra maneira de realizar o trabalho.','sira','malik'],['Peço que cada um contribua com uma solução.','cavan','muirenn'],['Busco materiais nos arredores.','rowan','rhiona']]},
{q:'Você encontra um animal ferido junto ao bosque.',a:[['Cuido dele, mesmo que demore.','rowan','muirenn'],['Preparo algo para aliviar sua dor.','muirenn','cavan'],['Investigo como foi ferido.','malik','rowan'],['Garanto que o local está seguro.','sira','rhiona']]},
{q:'Uma história antiga contradiz tudo que lhe ensinaram.',a:[['Comparo as versões e suas fontes.','cavan','malik'],['Escuto quem preservou a história.','muirenn','rowan'],['Viajo para descobrir a verdade.','malik','sira'],['Penso no que isso muda para minha comunidade.','rhiona','cavan']]},
{q:'Alguém próximo pede que você guarde um segredo.',a:[['Guardo, desde que ninguém esteja em risco.','rowan','rhiona'],['Tento compreender o motivo.','muirenn','cavan'],['Questiono o que ainda não foi contado.','malik','sira'],['Protejo a pessoa enquanto decido o que fazer.','sira','rowan']]},
{q:'Uma tempestade ameaça as casas da vila.',a:[['Reforço portas, telhados e estruturas.','rhiona','cavan'],['Organizo abrigo para os moradores.','cavan','muirenn'],['Busco uma rota segura para os isolados.','rowan','sira'],['Coordeno uma saída antes que seja tarde.','sira','malik']]},
{q:'Você recebe um mapa incompleto de uma região desconhecida.',a:[['Quero explorar cada lacuna.','malik','sira'],['Identifico trilhas, rios e abrigos.','rowan','muirenn'],['Estudo os símbolos antes de partir.','cavan','malik'],['Preparo recursos para uma expedição segura.','rhiona','sira']]},
{q:'Duas pessoas discordam sobre uma tradição da vila.',a:[['Escuto as duas e procuro conciliar.','cavan','muirenn'],['Defendo o valor dos costumes antigos.','muirenn','rowan'],['Pergunto como a tradição começou.','malik','cavan'],['Prefiro uma solução prática para o presente.','rhiona','sira']]},
{q:'Você precisa escolher o que levar numa viagem perigosa.',a:[['Uma ferramenta resistente.','rhiona','sira'],['Suprimentos e remédios.','muirenn','cavan'],['Um diário para registrar descobertas.','malik','cavan'],['Equipamento leve para atravessar os ermos.','rowan','sira']]},
{q:'Uma decisão sua pode decepcionar alguém importante.',a:[['Cumpro o dever que assumi.','cavan','rhiona'],['Sigo o que considero certo, mesmo sozinho.','rowan','muirenn'],['Converso antes de decidir.','muirenn','malik'],['Aceito o custo de escolher meu próprio caminho.','sira','malik']]},
{q:'Ao cair da noite, um sino toca onde não deveria haver ninguém.',a:[['Protejo os outros e verifico a origem.','rhiona','rowan'],['Observo o fenômeno e busco uma explicação.','cavan','malik'],['Escuto o que o lugar parece querer dizer.','muirenn','rowan'],['Vou investigar antes que o sinal desapareça.','sira','malik']]}
] as const;
export function rank(answers:number[]){const scores:Record<string,number>={};for(const c of characters)scores[c.id]=0;answers.forEach((a,i)=>{const opt=questions[i]?.a[a];if(opt){scores[opt[1]]+=3;scores[opt[2]]+=1}});return characters.map(c=>({id:c.id,score:scores[c.id]})).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));}
