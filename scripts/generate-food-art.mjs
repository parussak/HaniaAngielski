// Repo-native SVG illustrations: the same rounded shapes, pastel fills and
// purple outline as the approved mascots. No system emoji or remote assets.
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const out=new URL('../public/illustrations/',import.meta.url);
await mkdir(out,{recursive:true});
const palette={ink:'#76558d',pink:'#ef9cbe',cream:'#fff1de',orange:'#efb581',blue:'#b6d9f5',purple:'#ceb5eb',green:'#b6cf8c',yellow:'#f9d487'};
const {ink,pink,cream,orange,blue,purple,green,yellow}=palette;
const p=(d,fill='none',extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const r=(x,y,w,h,fill,rx=8)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
const c=(x,y,rad,fill)=>`<circle cx="${x}" cy="${y}" r="${rad}" fill="${fill}"/>`;
const el=(x,y,rx,ry,fill)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}"/>`;
const star=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})">${p('M0-17 5-6 17-4 9 5 11 17 0 11-11 17-9 5-17-4-5-6Z',yellow)}</g>`;
const heart=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})">${p('M0 12C-40-10-18-34 0-17 18-34 40-10 0 12Z',pink)}</g>`;
const raw={
 apple:p('M100 44C69 22 42 47 49 81 56 124 87 129 100 118 118 130 148 113 153 79 158 42 131 28 100 44Z',pink)+p('M100 45 98 23')+p('M100 30Q119 7 136 18 130 39 100 37Z',green),
 biscuit:c(100,73,47,orange)+[[-20,-20],[15,-27],[28,4],[-25,14],[3,28],[0,-1]].map(([x,y])=>c(100+x,73+y,4,ink)).join(''),
 bread:p('M50 109V62C21 39 54 17 76 25 92 10 130 15 142 32 168 33 175 59 151 70V111Z',orange)+p('M65 110V67C40 48 68 34 85 43 101 31 130 38 133 51 153 53 151 69 137 76V110Z',cream),
 cereal:el(100,69,59,19,cream)+p('M41 69Q46 120 100 120 154 120 159 69Z',purple)+p('M138 62 157 18')+[70,90,113,131].map((x,i)=>el(x,65+(i%2)*8,9,4,orange)).join(''),
 cheese:p('M45 78 117 30Q151 34 157 60V117H45Z',yellow)+p('M45 78 157 60')+c(73,96,8,orange)+c(128,91,10,orange)+c(113,55,5,orange),
 chicken:p('M116 73 154 103M144 103Q148 91 157 98 174 96 169 108 170 120 157 116 148 123 143 114',cream)+p('M121 45Q155 82 118 102 93 122 62 97 35 76 63 49 95 19 121 45Z',orange),
 chips:[65,85,105,125].map((x,i)=>r(x,26+i%2*9,14,65,yellow,3)).join('')+p('M48 64Q100 90 152 64L139 119H61Z',pink),
 fish:p('M142 72 171 44V103Z',purple)+p('M32 74Q76 14 142 72 83 132 32 74Z',blue)+c(61,65,4,ink)+p('M96 44 109 25 123 57',blue)+p('M91 81Q102 66 91 51'),
 ham:el(100,76,62,42,pink)+el(100,76,49,30,cream)+el(100,76,38,22,pink),
 meat:p('M59 37Q28 55 47 97 67 128 105 111 171 102 155 58 140 28 117 42 85 10 59 37Z',pink)+el(99,76,18,13,cream)+p('M62 54 75 61M129 64 139 77'),
 juice:r(62,29,76,95,blue)+p('M62 29 82 12H121L138 29',cream)+r(105,12,12,22,purple,2)+c(100,77,24,orange)+p('M99 56 100 99M79 76 121 76'),
 pancake:el(100,100,59,17,orange)+el(100,88,59,17,yellow)+el(100,76,59,17,orange)+el(100,64,59,17,yellow)+p('M66 56Q84 45 104 52L127 60 119 91 108 83 96 91 86 64Z',pink)+r(91,43,24,13,cream,3),
 pasta:el(100,90,70,31,cream)+p('M53 81Q67 45 80 65T103 63T127 62L147 85M62 91Q78 59 91 80T119 77T141 90',yellow,'stroke-width="7"')+p('M75 70Q97 53 126 72L118 87 83 86Z',pink),
 potato:p('M57 48Q104 11 144 47 172 85 124 111 65 137 45 94 34 71 57 48Z',orange)+p('M65 66 71 71M105 46 108 52M126 78 131 82M87 99 91 104'),
 rice:el(100,67,54,27,cream)+p('M41 71Q48 121 100 121 152 121 159 71Z',blue)+p('M64 62 72 55M88 52 95 46M109 56 117 49M130 65 136 58M85 70 93 63'),
 salad:p('M44 66Q38 32 67 41 75 17 98 39 129 11 137 43 168 28 155 71Z',green)+c(76,64,16,pink)+c(126,60,15,orange)+p('M40 71Q45 119 100 119 155 119 160 71Z',purple),
 sandwich:p('M38 105 95 29 165 105Z',orange)+p('M47 100 97 40 154 100Z',cream)+p('M44 109H159L148 119H55Z',green)+p('M51 120H149',pink,'stroke-width="7"'),
 sausage: p('M44 90Q95 25 157 68',orange,'stroke-width="31"')+p('M43 90Q98 41 157 69',pink,'stroke-width="14"')+p('M66 76 75 60M100 64 105 48M133 69 140 56'),
 tomato:c(100,79,47,pink)+p('M100 39 82 31 90 47 70 49 92 56 102 43 117 53 110 38 126 30 106 34 104 21Z',green),
 carrot:p('M64 111 91 44Q113 27 133 48 150 65 124 79Z',orange)+p('M111 39Q87 6 103 10L118 28Q121 1 133 10L130 33Q152 9 157 25L137 45Z',green)+p('M89 62 103 72M79 82 91 90'),
 water:p('M100 17Q45 72 57 97 67 131 101 126 140 125 145 95 148 72 100 17Z',blue)+p('M76 91Q73 108 92 110'),
 yoghurt:p('M59 48H141L129 120H71Z',purple)+el(100,48,44,12,cream)+p('M100 37 132 12',blue,'stroke-width="12"')+r(74,72,52,26,cream,4),
 jam:p('M66 44H134V112Q134 125 120 125H80Q66 125 66 112Z',pink)+r(62,25,76,20,purple,5)+r(75,66,50,37,cream,5)+p('M100 79C78 66 81 88 100 98 119 88 122 66 100 79Z',pink)+p('M93 76 100 70 107 76',green),
 butter:r(38,88,125,28,purple,10)+p('M61 85V47L115 35 145 51V85Z',yellow)+p('M61 47 92 60 145 51M92 60V86'),
 chocolate:r(56,20,88,110,cream,3)+[0,1,2].flatMap(y=>[0,1].map(x=>r(62+x*39,27+y*31,34,26,'#b78d88',3))).join(''),
 egg:p('M99 19C74 19 49 75 52 95 54 137 147 137 149 95 152 71 124 19 99 19Z',cream),
 flour:p('M55 41 67 25H137L147 43 136 124H60Z',cream)+p('M57 43Q100 56 145 43')+p('M95 103 112 65M100 86Q80 76 89 68 100 69 103 80M106 78Q123 80 125 69 118 64 110 70M111 66Q103 54 112 50 121 55 111 66',yellow),
 lemon:p('M55 51Q96 17 143 51L158 69 146 82Q108 122 63 93L43 75Z',yellow)+p('M70 58Q90 44 109 49'),
 milk:p('M59 25H141L131 121H69Z',blue)+p('M64 57Q100 66 136 57L130 119H70Z','#ffffff')+el(100,25,41,10,blue),
 strawberry:p('M51 56Q100 25 149 56 151 95 100 125 49 95 51 56Z',pink)+p('M100 45 79 25 88 46 63 41 88 58 101 44 116 56 139 39 115 44 122 22Z',green)+p('M75 70 79 77M103 66 106 74M126 75 121 82M99 95 101 103'),
 sugar:p('M52 80Q75 32 100 45 129 38 148 80Z',cream)+p('M44 79Q52 121 100 121 148 121 156 79Z',purple)+p('M122 53 156 19',blue,'stroke-width="9"')+[[74,68],[91,57],[112,67],[98,74]].map(([x,y])=>c(x,y,1.5,ink)).join(''),
 bottle:p('M81 36V22H119V36Q140 44 140 60V117Q140 126 130 126H70Q60 126 60 117V60Q60 44 81 36Z',blue)+r(78,12,44,13,purple,3)+r(61,65,78,28,cream,3),
 can:r(65,20,70,109,pink,14)+el(100,24,35,9,purple)+el(100,25,12,3,cream)+p('M79 58 115 94M84 98 117 63',cream,'stroke-width="8"'),
 cake:p('M50 64Q51 37 100 37 149 37 150 64V115H50Z',orange)+p('M50 64Q65 50 76 65T100 65T125 64T150 64V78Q135 66 124 80T100 79T75 80T50 79Z',pink)+p('M100 37V18')+p('M99 18Q84 10 100 3 116 10 99 18Z',yellow),
 book:p('M100 39Q70 18 32 30V113Q70 103 100 125 130 103 168 113V30Q130 18 100 39Z',cream)+p('M100 39V124M47 49 83 57M47 68 83 76M117 57 153 49M117 76 153 68'),
 diary:r(51,18,99,111,purple,6)+r(64,18,8,111,cream,0)+r(85,42,43,33,cream,4)+p('M93 53H119M93 63H112'),
 pan:el(91,89,58,31,purple)+el(91,83,57,26,cream)+p('M142 72 179 38',blue,'stroke-width="14"')+el(89,79,28,16,cream)+c(89,79,12,yellow),
 toaster:r(38,49,124,72,blue,19)+p('M58 49V28Q51 13 65 10H95Q110 13 102 28V49M105 49V28Q98 13 112 10H137Q153 13 145 28V49',cream)+p('M151 77H176M172 69V101')+r(53,120,20,8,purple,3)+r(126,120,20,8,purple,3),
 cottage: p('M45 75Q52 122 100 122 148 122 155 75Z',purple)+[65,87,110,131].map((x,i)=>c(x,68-(i%2)*10,17,cream)).join(''),
 cream:el(100,97,57,27,purple)+p('M59 87Q60 65 81 62 66 47 100 34 121 15 115 9 154 46 123 59 152 71 139 88Z',cream),
 pizza:p('M37 111 99 24 165 111Z',yellow)+p('M38 111Q101 94 164 111',orange,'stroke-width="14"')+c(94,66,9,pink)+c(74,91,8,pink)+c(122,89,8,pink)+p('M106 88 116 74M82 79 89 88',green,'stroke-width="6"'),
 glass:el(100,26,39,10,blue)+p('M61 26 70 121H130L139 26',blue)+p('M102 90 109 12H135')+el(96,64,23,13,yellow),
 tree:p('M93 76H108V127H93Z',orange)+c(100,48,32,green)+c(72,69,27,green)+c(126,70,27,green),
 flower:p('M100 78V125M99 101Q121 79 136 96 123 113 100 108',green)+[[-22,0],[0,-22],[22,0],[0,22]].map(([x,y])=>c(100+x,55+y,18,pink)).join('')+c(100,55,13,yellow),
 ball:c(100,77,43,cream)+p('M100 53 121 68 113 92H87L79 68Z',purple)+p('M100 53V34M121 68 139 61M113 92 126 114M87 92 75 113M79 68 61 61'),
 clock:c(100,74,48,cream)+p('M100 42V76L126 88')+p('M63 21 48 37M137 21 152 37',purple,'stroke-width="7"'),
 palette:el(100,76,63,43,cream)+c(64,70,9,pink)+c(92,48,9,blue)+c(126,59,9,green)+p('M113 109 155 22',purple,'stroke-width="11"'),
 globe:c(100,74,48,blue)+p('M65 42 81 34 100 45 92 65 76 70 63 55M112 71 137 81 130 103 112 116 105 95Z',green),
 balloon:el(100,57,35,43,pink)+p('M100 100 94 110H106ZM100 110Q126 121 100 135'),
 bird:p('M44 90Q52 52 86 63 101 29 131 47 146 62 132 84L152 96H110Q78 115 44 90Z',cream)+p('M133 59 154 69 133 76Z',yellow)+c(124,59,3,ink)+p('M72 76Q92 65 111 82'),
 round:c(100,74,47,purple),
 sweet:r(70,46,60,59,pink,15)+p('M70 57 43 40V108L70 94M130 57 157 40V108L130 94',purple),
 light:c(100,57,31,yellow)+p('M79 81V103H121V81M86 113H114M92 124H108M100 12V3M47 38 36 31M154 38 165 31'),
 utensils:el(100,78,48,41,cream)+p('M30 22V60M18 22V47Q30 65 42 47V22M30 60V123M172 22V124M172 22Q148 49 172 66'),
 packet:r(54,19,92,108,purple,3)+p('M54 31H146M54 114H146')+c(100,73,28,orange)+c(90,66,3,ink)+c(113,75,3,ink)+c(94,87,3,ink),
 basket:p('M47 67H153L140 123H60Z',orange)+p('M61 67Q65 16 100 16 135 16 139 67M74 70 79 118M100 70V120M125 70 120 118'),
 beach:p('M29 110Q100 87 171 110',yellow,'stroke-width="15"')+p('M100 110 114 40')+p('M58 47Q111-1 163 57Z',purple)+p('M114 20 114 53')+c(44,26,13,yellow),
 swim:p('M28 112Q44 100 60 112T92 112T124 112T156 112T184 112',blue,'stroke-width="8"')+c(135,62,17,cream)+p('M51 95 95 66 113 86M96 66 67 45 47 61',purple,'stroke-width="14"'),
 clover:[[-13,-13],[13,-13],[-13,13],[13,13]].map(([x,y])=>c(100+x,60+y,19,green)).join('')+p('M100 73Q119 98 102 123'),
 tools:p('M60 31 144 115',blue,'stroke-width="16"')+p('M130 20Q150 15 159 34L139 49 126 39 124 25 112 46 122 62 55 117',purple,'stroke-width="12"'),
 arrow:p('M75 124V70H48L100 17 152 70H125V124Z',purple),
 lightning:p('M108 14 58 80H97L86 129 147 57H111L127 14Z',yellow),
 face:c(100,73,45,cream)+p('M72 62Q82 51 91 62M110 62Q120 51 129 62M79 88Q100 108 121 88')+el(69,80,8,4,pink)+el(131,80,8,4,pink),
 surprise:c(100,73,45,cream)+c(82,62,5,ink)+c(118,62,5,ink)+el(100,92,10,13,pink),
 horrible:c(100,73,45,cream)+p('M72 54 89 65 72 72M129 54 112 65 129 72M82 101Q100 82 118 101'),
 eyes:el(75,70,24,32,cream)+el(126,70,24,32,cream)+el(85,73,7,12,ink)+el(136,73,7,12,ink),
 sunglasses:c(100,73,45,cream)+p('M56 54H98L92 78H65ZM102 54H144L135 78H108Z',purple)+p('M95 60H105M83 99Q100 108 117 99'),
};
const wrap=(body,width=200,height=140)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" fill="none" stroke="${ink}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`;
const object=(name,x=0,y=0,scale=1)=>`<g transform="translate(${x} ${y}) scale(${scale})">${raw[name]}</g>`;
const person=(x,y,{color=purple,pose='wave',face='happy'}={})=>`<g transform="translate(${x} ${y})">${p('M-19 110V63Q0 49 19 63V110Z',color)}${c(0,33,23,cream)}${p('M-23 27Q-12-2 13 13L22 28Q3 12-23 27Z',orange)}${c(-8,33,1.8,ink)}${c(8,33,1.8,ink)}${face==='surprise'?el(0,46,4,5,pink):p('M-6 44Q0 49 6 44')}${pose==='wave'?p('M-17 67-31 52-35 33M18 68 39 54'):pose==='hungry'?p('M-17 66-22 86 4 91M18 66 24 85 4 91'):p('M-18 68-32 93M18 68 40 82')}${p('M-11 111V134M11 111V134')}</g>`;
const bubble=(x,y,body)=>`<g transform="translate(${x} ${y})">${p('M0 0H77Q86 0 86 10V47Q86 57 76 57H32L20 68V57H10Q0 57 0 47Z',cream)}${body}</g>`;
const scenes={};
function dining(food='pizza',offer=false){return person(57,28)+person(260,28,{color:blue,pose:'rest'})+r(90,116,143,10,orange,3)+p('M101 128V160M222 128V160')+object(food,116,55,.48)+(offer?bubble(102,4,object(food,7,0,.35)):bubble(102,4,p('M33 14Q33 3 45 8 60 13 45 26V34')+c(45,44,1.5,ink)));}
scenes['scene-ordering']=dining();
scenes['scene-drink-offer']=dining('glass',true);
scenes['scene-sandwich-request']=dining('sandwich',true);
scenes['scene-chips-request']=dining('chips',true);
scenes['scene-milkshake-order']=dining('glass',true)+object('strawberry',185,70,.23);
scenes['scene-breakfast-egg']=person(58,28,{pose:'rest'})+r(94,118,190,9,orange,3)+object('egg',125,51,.5)+object('bread',198,66,.35);
scenes['scene-breakfast-milk']=person(58,28,{pose:'rest'})+r(94,118,190,9,orange,3)+object('cereal',118,61,.5)+object('milk',195,45,.55);
scenes['scene-bread-butter']=person(58,28,{pose:'rest'})+r(94,118,190,9,orange,3)+object('bread',122,48,.55)+object('butter',208,73,.33);
scenes['scene-drinking-juice']=person(60,28,{pose:'rest'})+object('glass',93,13,.7)+object('juice',185,52,.65);
scenes['scene-eat-apple']=person(65,27,{pose:'rest'})+object('apple',85,30,.65)+object('apple',207,76,.36);
scenes['scene-cooking']=person(65,25,{pose:'rest'})+r(110,119,180,9,orange,3)+object('pan',115,52,.55)+object('egg',215,58,.4);
scenes['scene-decorate']=person(65,25,{pose:'rest'})+r(110,119,180,9,orange,3)+object('cake',140,42,.65)+star(258,46,.55);
scenes['scene-picnic']=p('M40 112 262 112 286 162H22Z',pink)+person(60,5,{pose:'rest'})+person(263,6,{color:blue,pose:'rest'})+object('basket',119,54,.65)+object('sandwich',80,105,.37)+object('bottle',198,95,.4);
scenes['scene-sport-hungry']=person(51,23,{pose:'rest'})+object('ball',57,92,.36)+p('M118 80H183M171 68 183 80 171 92',ink)+person(246,23,{pose:'hungry'})+bubble(124,2,object('sandwich',7,0,.35));
scenes['scene-loves-eggs']=person(60,24,{pose:'rest'})+object('pan',98,67,.55)+object('egg',205,48,.62)+heart(245,26,.65);
scenes['scene-loves-pizza']=person(60,24,{pose:'rest'})+object('pizza',165,38,.8)+heart(137,47,.7);
scenes['scene-shopping']=person(52,23,{pose:'rest'})+person(267,23,{color:blue,pose:'rest'})+r(88,117,145,10,orange,2)+object('bottle',93,51,.48)+object('juice',155,51,.48);
// A scene's inventory depicts the truth of the sentence without printing the
// English answer. Empty shelves are deliberately different from full ones.
function inventory(name,{empty=false,count=1,question=false,many=false}={}){
 let body=r(90,12,210,146,purple,12)+r(103,24,184,121,cream,5)+p('M105 96H285M108 138H282');
 if(!empty){const scale=many?.27:count>1?.36:.65;const positions=many?[[105,26],[154,26],[203,26],[105,85],[154,85],[203,85]]:count>1?[[112,42],[169,42],[222,42]].slice(0,count):[[133,30]];body+=positions.map(([x,y])=>object(name,x,y,scale)).join('');}
 body+=person(44,23,{pose:'rest',face:empty?'surprise':'happy'});
 if(question)body+=bubble(117,3,p('M34 14Q34 5 45 9 58 15 45 26V34')+c(45,44,1.5,ink));
 if(empty)body+=p('M142 57 164 79M164 57 142 79',pink,'stroke-width="5"');
 return body;
}
for(const name of ['milk','water','egg','apple','lemon','strawberry','flour','sugar','butter','chocolate','biscuit','cheese','jam','bottle','juice']){
 scenes[`scene-${name}-present`]=inventory(name,{count:['egg','apple','strawberry','biscuit','bottle','juice'].includes(name)?3:1});
 scenes[`scene-${name}-question`]=inventory(name,{count:['egg','apple','biscuit','bottle','juice'].includes(name)?3:1,question:true});
}
for(const name of ['milk','egg','butter'])scenes[`scene-${name}-missing`]=inventory(name,{empty:true});
scenes['scene-water-lots']=inventory('bottle',{many:true});
scenes['scene-apple-lots']=inventory('apple',{many:true});
scenes['scene-milk-lots']=inventory('milk',{many:true});
scenes['scene-single-egg']=inventory('egg');
scenes['scene-two-eggs']=inventory('egg',{count:2});
scenes['scene-two-bottles']=r(48,123,224,8,orange,3)+object('bottle',37,19,.82)+object('bottle',164,19,.82);
scenes['scene-throw']=person(60,24,{pose:'wave'})+object('pancake',146,12,.5)+p('M108 77Q145 14 204 31',purple,'stroke-dasharray="6 8"');
scenes['scene-on-top']=object('pancake',86,43,.85)+object('strawberry',130,8,.43);
scenes['scene-put']=person(60,24,{pose:'rest'})+object('pan',135,68,.6)+object('egg',151,17,.37)+p('M205 64V87M197 79 205 87 213 79');
scenes['scene-people']=[50,155,260].map((x,i)=>person(x,22,{pose:'rest',color:i%2?blue:purple})).join('');
scenes['scene-fun']=person(72,25)+person(241,25,{color:blue})+star(150,29,.6)+heart(157,83,.6);
scenes['scene-quick-breakfast']=scenes['scene-breakfast-milk']+object('clock',-10,-6,.36);
const aliases={
 'fruit':['apple','lemon'],'vegetable':['carrot'],'tuna':['fish'],'orange-juice':['juice'],
 'breakfast':['cereal'],'dinner':['utensils'],'lunch':['sandwich'],'jam':['jam'],'make':['scene-cooking'],
 'cool':['sunglasses'],'good-idea':['light'],'what-a-disaster':['surprise'],'birthday':['cake'],'chocolate-cake':['cake'],'decorate':['scene-decorate'],'look':['eyes'],'put':['scene-put'],'recipe':['book'],
 'a-bar-of-chocolate':['chocolate'],'a-bottle-of-water':['bottle'],'a-can-of-cola':['can'],'a-carton-of-juice':['juice'],'a-jar-of-jam':['jam'],'a-packet-of-biscuits':['packet'],
 'all-of':['scene-people'],'beautiful':['flower'],'can-t-wait':['clock'],'chicken-legs':['chicken'],'go-for-a-swim':['swim'],'go-to-the-beach':['beach'],'go-to-the-park':['tree'],'have-a-picnic':['scene-picnic'],
 'how-many':['scene-apple-question'],'how-much':['scene-water-question'],'quick':['lightning'],'seagull':['bird'],'terrible':['horrible'],'anything-else':['scene-ordering'],
 'can-i-have-a-vegetarian-pizza-please':['scene-ordering'],'i-d-like-a-lemonade-please':['scene-drink-offer'],'what-would-you-like':['scene-ordering'],'would-you-like-anything-to-drink':['scene-drink-offer'],
 'milkshake':['glass'],'all-over-the-world':['globe'],'art':['palette'],'celebrity':['scene-fun'],'cook':['scene-cooking'],'cottage-cheese':['cottage'],'good-luck':['clover'],'have-fun':['scene-fun'],'in-the-air':['balloon'],'ingredient':['egg','flour'],'on-top':['scene-on-top'],'popular':['scene-people'],'special':['round','star'],'throw':['scene-throw'],'use':['tools'],'have-a-quick-breakfast':['scene-quick-breakfast'],'toast':['bread'],'frying-pan':['pan'],'enjoy-your-meal':['scene-breakfast-egg'],
};
raw.star=star(100,75,2.3);
const words=JSON.parse(await readFile(new URL('../public/content/02-food/slownictwo.json',import.meta.url),'utf8'));
for(const w of words){
 const names=aliases[w.id]??[w.id];let body,width=200,height=140;
 if(names.length===1 && scenes[names[0]]){body=scenes[names[0]];width=320;height=170;}
 else {for(const n of names)if(!raw[n])throw new Error(`Brak ilustracji: ${w.id}/${n}`);body=names.length===1?raw[names[0]]:names.map((n,i)=>object(n,i*80,28,.65)).join('');}
 await writeFile(new URL(`word-${w.id}.svg`,out),wrap(body,width,height));
}
for(const [id,body] of Object.entries(scenes))await writeFile(new URL(`${id}.svg`,out),wrap(body,320,170));
// Existing public SVG paths stay valid for old cached content/active sessions.
for(const [file,name] of Object.entries({'yoghurt':'yoghurt','water-bottle':'bottle','toaster':'toaster','sugar':'sugar','jam-jar':'jam','flour':'flour','cream':'cream','cottage-cheese':'cottage'}))await writeFile(new URL(`${file}.svg`,out),wrap(raw[name]));
console.log(`${words.length} ilustracji słówek i ${Object.keys(scenes).length} scenek SVG.`);
