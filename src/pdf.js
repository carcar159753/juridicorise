const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const titles = {
  patente_nome:['PATENTE DE NOME','NOME FAMILIAR'], certidao_nascimento:['CERTIDÃO','DE NASCIMENTO'], certidao_adocao:['CERTIDÃO','DE ADOÇÃO'],
  alvara_funcionamento:['ALVARÁ','DE FUNCIONAMENTO'], troca_nome:['CERTIDÃO','DE TROCA DE NOME'], registro_familiar:['REGISTRO','FAMILIAR'],
  porte_armas:['PORTE','DE ARMAS'], processos:['PROCESSO','JUDICIAL'], mandados:['MANDADO','JUDICIAL'], documentos_diversos:['DOCUMENTO','DIVERSO'], obito:['CERTIDÃO','DE ÓBITO']
};

function line(doc,x,y,w){ doc.moveTo(x,y).lineTo(x+w,y).strokeColor('#777').lineWidth(.8).stroke(); }
function border(doc){
  const gold = '#9b7608';
  doc.rect(28,28,539,786).lineWidth(3).strokeColor(gold).stroke();
  doc.rect(40,40,515,762).lineWidth(.8).strokeColor('#2b2b2b').stroke();
  doc.fontSize(72).fillColor('#9b760812').font('Times-Bold').text('JUSTIÇA RISE', 80, 350, {align:'center', rotate: -18});
}
function textOr(v, alt='__________'){ return (v && String(v).trim()) ? String(v).trim() : alt; }

async function generatePremiumPDF(record, user){
  const doc = new PDFDocument({ size:'A4', margin:50, bufferPages:true });
  const chunks=[]; doc.on('data',c=>chunks.push(c));
  const done = new Promise(resolve=>doc.on('end',()=>resolve(Buffer.concat(chunks))));
  border(doc);
  const d = record.data || {};
  const [t1,t2] = titles[record.type] || ['DOCUMENTO','OFICIAL'];
  const number = `${record.type.toUpperCase().slice(0,3)}-${new Date().getFullYear()}-${String(record.id||'000000').slice(0,8)}`;
  const code = `RISE-${number}`;
  const qr = await QRCode.toDataURL(code);
  doc.image(Buffer.from(qr.split(',')[1],'base64'), 500, 55, {width:48});
  doc.circle(83,78,30).fillAndStroke('#050914','#c49a18');
  doc.fillColor('#f6d85f').fontSize(22).font('Times-Bold').text('⚖', 70, 67);
  doc.fillColor('#876500').font('Times-Bold').fontSize(38).text(t1, 120, 48, {width:350, align:'center'});
  doc.fontSize(18).text(t2, 120, 92, {width:350, align:'center'});
  doc.fillColor('#111').fontSize(9).font('Helvetica').text(`Nº ${number}`, 50, 125, {align:'right'});
  doc.moveDown(3);
  const yStart = 160;
  doc.font('Times-Roman').fontSize(14).fillColor('#111');
  const emissão = textOr(d.data_emissao || d.data || new Date().toLocaleDateString('pt-BR'));
  if(record.type === 'patente_nome'){
    doc.text('O Poder Judiciário, por meio da Autoridade Judicial Responsável, no exercício de sua competência, CONCEDE à família', 70, yStart, {width:455, align:'center'});
    doc.font('Times-Bold').fontSize(36).fillColor('#876500').text(textOr(d.nome_familia || record.title).toUpperCase(), 70, 220, {width:455, align:'center'});
    line(doc,180,268,235);
    doc.font('Times-Roman').fontSize(14).fillColor('#111').text(`o direito exclusivo de uso do referido sobrenome, conforme estabelecido pela Lei de Registro e Patenteamento de Nomes.`, 75, 295, {width:445, align:'center'});
    doc.text(`O uso do sobrenome é restrito aos membros da família e aos autorizados pelo responsável legal:`,75,350,{width:445,align:'center'});
    doc.font('Times-Bold').text(`${textOr(d.responsavel || record.nome)} | ID: ${textOr(d.responsavel_id || record.person_id)} | Tel: ${textOr(record.telefone || d.telefone)}`,75,382,{width:445,align:'center'});
  } else if(record.type === 'alvara_funcionamento'){
    doc.text(`O Departamento de Justiça da Cidade Rise certifica que o estabelecimento abaixo atende aos requisitos necessários para funcionamento.`,70,yStart,{width:455,align:'center'});
    doc.font('Times-Bold').fontSize(26).fillColor('#876500').text(textOr(d.estabelecimento || record.title),70,220,{width:455,align:'center'});
    doc.font('Times-Roman').fontSize(14).fillColor('#111').text(`Proprietário: ${textOr(record.nome || d.proprietario)} | ID: ${textOr(record.person_id || d.proprietario_id)} | Telefone: ${textOr(record.telefone || d.telefone)}`,75,285,{width:445,align:'center'});
    doc.text(`Endereço: ${textOr(d.endereco)}\nValidade: ${textOr(d.validade)}`,75,330,{width:445,align:'center'});
  } else {
    doc.text(`O Poder Judiciário da Cidade Rise, por meio da Autoridade Judicial Responsável, reconhece e declara oficialmente as informações abaixo:`,70,yStart,{width:455,align:'center'});
    doc.font('Times-Bold').fontSize(30).fillColor('#876500').text(textOr(record.nome || record.title),70,225,{width:455,align:'center'});
    line(doc,150,270,295);
    doc.font('Times-Roman').fontSize(14).fillColor('#111').text(`ID: ${textOr(record.person_id)} | Telefone: ${textOr(record.telefone)} | Sexo: ${textOr(record.sexo)}`,75,305,{width:445,align:'center'});
    doc.text(textOr(d.descricao || d.observacao || record.title, 'Documento emitido conforme os registros legais do Departamento de Justiça Rise.'),75,350,{width:445,align:'center'});
  }
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#111').text(`Status: ${textOr(record.status,'Aprovado')}`,70,455,{width:455,align:'center'});
  doc.font('Times-Roman').fontSize(14).text(`Rise, ${emissão}`,70,485,{width:455,align:'center'});
  doc.image(Buffer.from(qr.split(',')[1],'base64'), 262, 535, {width:70});
  doc.font('Times-Italic').fontSize(19).fillColor('#111').text(textOr(d.advogado || user.name),70,610,{width:180,align:'center'}); line(doc,70,640,180);
  doc.font('Times-Roman').fontSize(11).text('Advogado / Responsável',70,646,{width:180,align:'center'});
  doc.font('Times-Italic').fontSize(19).text(textOr(d.autoridade || 'Carcar'),345,610,{width:180,align:'center'}); line(doc,345,640,180);
  doc.font('Times-Roman').fontSize(11).text('Autoridade Judicial',345,646,{width:180,align:'center'});
  doc.font('Helvetica').fontSize(8).fillColor('#555').text(`Código de autenticação: ${code}`,50,775,{width:495,align:'center'});
  doc.end();
  return done;
}
module.exports = { generatePremiumPDF };
