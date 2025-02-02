
$(document).ready(function() {
    $('.mask-cpf').mask('000.000.000-00');
    $('.mask-rg').mask('00.000.000-0');
    $('.mask-cep').mask('00000-000');
    $('.mask-money').mask('000.000.000.000.000,00', {reverse:true});
});

$(document).ready(function(){
    $('input').on('input', function() {
        let valor = $(this).val();
        let novoValor = valor.toLowerCase().replace(/\b\w/g, letra => letra.toUpperCase());
        $(this).val(novoValor);
    });
});

$(document).ready(function() {
    // Função genérica para limpar campos
    function limpaCampos(prefixo) {
        $(`#${prefixo}Logradouro`).val("");
        $(`#${prefixo}Complemento`).val("");
        $(`#${prefixo}Bairro`).val("");
        $(`#${prefixo}Cidade`).val("");
        $(`#${prefixo}UF`).val("");
    }

    // Função genérica para tratamento do CEP
    function handleCEP(prefixo) {
        $(`#${prefixo}CEP`).blur(function() {
            var cep = $(this).val().replace(/\D/g, '');
            var campos = {
                logradouro: $(`#${prefixo}Logradouro`),
                complemento: $(`#${prefixo}Complemento`),
                bairro: $(`#${prefixo}Bairro`),
                cidade: $(`#${prefixo}Cidade`),
                uf: $(`#${prefixo}UF`)
            };

            if (cep.length === 8) {
                // Feedback de carregamento
                Object.values(campos).forEach(campo => campo.val("..."));

                $.getJSON(`https://viacep.com.br/ws/${cep}/json/?callback=?`, function(dados) {
                    if (!dados.erro) {
                        campos.logradouro.val(dados.logradouro);
                        campos.complemento.val(dados.complemento);
                        campos.bairro.val(dados.bairro);
                        campos.cidade.val(dados.localidade);
                        campos.uf.val(dados.uf.toUpperCase());
                    } else {
                        limpaCampos(prefixo);
                        alert("CEP não encontrado");
                    }
                }).fail(function() {
                    limpaCampos(prefixo);
                    alert("Erro na consulta do CEP");
                });
            } else if (cep !== "") {
                limpaCampos(prefixo);
                alert("Formato de CEP inválido");
            }
        });
    }

    // Aplica para todos os grupos
    ['locador', 'locatario', 'imovel'].forEach(prefixo => {
        handleCEP(prefixo);
        
        // Máscara do CEP (opcional)
        $(`#${prefixo}CEP`).on('input', function() {
            let valor = $(this).val().replace(/\D/g, '');
            if (valor.length > 5) valor = valor.replace(/^(\d{5})(\d)/, '$1-$2');
            $(this).val(valor);
        });
    });
});



window.onload = function(){
    sessionStorage.clear();
    localStorage.clear();
};


function mesNumeroToText(mes) {
    const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril",
        "Maio", "Junho", "Julho", "Agosto",
        "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    // Converte o mês para número e valida
    const mesNumero = parseInt(mes, 10);
    if (isNaN(mesNumero) || mesNumero < 1 || mesNumero > 12) {
        return undefined; // Retorna undefined se inválido
    }

    return meses[mesNumero - 1]; // Ajusta para índice do array (0 a 11)
}


document.getElementById('contratoForm').addEventListener('submit', function(e){
    e.preventDefault();
    gerarContrato();
});

document.getElementById('exportarPDF').addEventListener('click', gerarPDF);

function numeroPorExtenso(num) {
    const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

    function converteGrupo(n) {
        let partes = [];
        const centena = Math.floor(n / 100);
        const resto = n % 100;

        if (n === 100) return ['cem']; // Exceção para 100
        if (centena > 0) partes.push(centenas[centena]);

        if (resto >= 10 && resto <= 19) {
            partes.push(especiais[resto - 10]);
        } else {
            const dez = Math.floor(resto / 10);
            const unid = resto % 10;

            if (dez > 1) partes.push(dezenas[dez]);
            if (unid > 0) partes.push(unidades[unid]);
        }

        return partes;
    }

    let extenso = [];
    const milhões = Math.floor(num / 1_000_000);
    const restoMilhão = num % 1_000_000;
    const milhares = Math.floor(restoMilhão / 1000);
    const restoMil = restoMilhão % 1000;

    if (milhões > 0) {
        extenso.push(...converteGrupo(milhões));
        extenso.push(milhões === 1 ? 'milhão' : 'milhões');
    }

    if (milhares > 0) {
        extenso.push(...converteGrupo(milhares));
        extenso.push('mil');
    }

    if (restoMil > 0) {
        if (extenso.length > 0) extenso.push('e'); // Garante a gramática correta
        extenso.push(...converteGrupo(restoMil));
    }

    // Trata casas decimais
    const decimal = Math.round((num - Math.floor(num)) * 100);
    let decimalExtenso = '';
    if (decimal > 0) {
        decimalExtenso = ' e ' + converteGrupo(decimal).join(' e ') + ' centavos';
    }

    // Ajustes finais
    let resultado = extenso.join(' ')
        .replace(/um mil/g, 'mil') // Ajuste para "mil" sem "um"
        .replace(/  +/g, ' ') // Remove espaços extras
        .trim();

    return resultado.charAt(0).toUpperCase() + resultado.slice(1) + ' reais' + decimalExtenso;
}


function formatarNumero(valor) {
    return parseFloat(valor.replace("R$", "").replace(/\./g, "").replace(",", ".").trim());
}

function getFieldValue(id, toUpperCase = false){
    const value = document.getElementById(id)?.value.trim() || "";
    return toUpperCase ? value.toUpperCase() : value;
}


function subtrairValores(moeda1, moeda2) {
    function converterParaNumero(moeda) {
        return parseFloat(moeda.replace("R$", "").trim().replace(/\./g, "").replace(",", "."));
    }

    const num1 = converterParaNumero(moeda1);
    const num2 = converterParaNumero(moeda2);

    return (num1 - num2).toFixed(2); // Mantém precisão de 2 casas decimais
}

function formatarMoeda(valor) {
    // Remove todos os caracteres não numéricos
    const valorNumerico = valor.replace(/[^0-9]/g, '');

    // Converte para número e divide por 100 para obter o valor correto
    const valorDecimal = Number(valorNumerico) / 100;

    // Formata o valor usando Intl.NumberFormat
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valorDecimal);
}


function gerarContrato(){

    const locador = {
        nome: getFieldValue('locadorNomeCompleto', true),
        nacionalidade: getFieldValue('locadorNacionalidade'),
        estadoCivil: getFieldValue('locadorEstadoCivil'),
        profissao: getFieldValue('locadorProfissao'),
        cpf: getFieldValue('locadorCPF'),
        rg: getFieldValue('locadorRG'),
        logradouro: getFieldValue('locadorLogradouro'),
        complemento: getFieldValue('locadorComplemento'),
        bairro:getFieldValue('locadorBairro'),
        numero:getFieldValue('locadorNumero'),
        cidade:getFieldValue('locadorCidade'),
        cep:getFieldValue('locadorCEP'),
        uf:getFieldValue('locadorUF')
    };

    const lc = sessionStorage.setItem("lc", JSON.stringify(locador));

    const locatario = {
        nome: getFieldValue('locatarioNomeCompleto', true),
        nacionalidade: getFieldValue('locatarioNacionalidade'),
        estadoCivil: getFieldValue('locatarioEstadoCivil'),
        profissao: getFieldValue('locatarioProfissao'),
        cpf: getFieldValue('locatarioCPF'),
        rg: getFieldValue('locatarioRG'),
        logradouro: getFieldValue('locatarioLogradouro'),
        complemento: getFieldValue('locatarioComplemento'),
        bairro:getFieldValue('locatarioBairro'),
        numero:getFieldValue('locatarioNumero'),
        cidade:getFieldValue('locatarioCidade'),
        cep:getFieldValue('locatarioCEP'),
        uf:getFieldValue('locatarioUF')
    };


    const lt = sessionStorage.setItem("lt", JSON.stringify(locatario));

    const dtlc = JSON.parse(sessionStorage.getItem("lc"));
    const dtlt = JSON.parse(sessionStorage.getItem("lt"));

    //Imóvel Endereço

    const imovel = {
        logradouro:getFieldValue('imovelLogradouro'),
        complemento:getFieldValue('imovelComplemento'),
        bairro:getFieldValue('imovelBairro'),
        numero:getFieldValue('imovelNumero'),
        cidade:getFieldValue('imovelCidade'),
        cep:getFieldValue('imovelCEP'),
        uf:getFieldValue('imovelUF')
    };

    const im = sessionStorage.setItem("im", JSON.stringify(imovel));

    const dtim = JSON.parse(sessionStorage.getItem("im"));


    //Termos do Contrato

    const contratoData = new Date();
    
    const contrato_info = {
        aluguel:getFieldValue('contratoAluguel'),
        agua:getFieldValue('contratoAgua'),
        limpeza:getFieldValue('contratoLimpeza'),
        dtInicial:getFieldValue('contratoDtInicial'),
        dtFinal:getFieldValue('contratoDtFinal'),
        cidade:getFieldValue('contratoCidade'),
        uf:getFieldValue('contratoUF'),
        dia:contratoData.getDate(),
        mes:mesNumeroToText(contratoData.getMonth() + 1),
        ano:contratoData.getFullYear()
    };

    const ct = sessionStorage.setItem("ct", JSON.stringify(contrato_info));
    const dtct = JSON.parse(sessionStorage.getItem("ct"));


    const dtInicial = new Date(dtct.dtInicial)
        .toLocaleDateString('pt-BR', { timeZone: 'UTC' }) // Correção do método e timeZone
    .replace(/(\d+)\/(\d+)\/(\d+)/, '$1/$2/$3') || "";

    const dtFinal= new Date(dtct.dtFinal) // Padronização camelCase
    .toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    .replace(/(\d+)\/(\d+)\/(\d+)/, '$1/$2/$3') || "";
        
    const aluguel = formatarMoeda(dtct.aluguel);
    const agua = formatarMoeda(dtct.agua);
    const limpeza = formatarMoeda(dtct.limpeza);

    const aluguel_texto = formatarNumero(dtct.aluguel);
    const valorExtenso = numeroPorExtenso(Number(aluguel_texto));

    const valorDesc = subtrairValores(aluguel, agua);
    const valorDescontado = formatarMoeda(valorDesc);

    // ==============================================
    // MODELO DO CONTRATO CORRIGIDO
    // ==============================================
    const contrato = `  
        <div class="box">
            <br>
            <br>
            <br>
            <h2 style="white-space:pre; text-align:center;">CONTRATO DE LOCAÇÃO DE IMÓVEL RESIDENCIAL</h2>
            
            <p style="white-space:pre;">
                <span class="subtitle">LOCADOR</span>:${dtlc.nome}, ${dtlc.nacionalidade}, ${dtlc.estadoCivil}, ${dtlc.profissao}, 
                portador da cédula de identidade RG. nº ${dtlc.rg} e CPF nº ${dtlc.cpf}, 
                residente e domiciliando à ${dtlc.logradouro}, ${dtlc.complemento}, ${dtlc.numero}, ${dtlc.bairro}, 
                CEP ${dtlc.cep}, ${dtlc.cidade} - ${dtlc.uf}.
            
                <span class="subtitle">LOCATÁRIO</span>:${dtlt.nome}, ${dtlt.nacionalidade}, ${dtlt.estadoCivil}, ${dtlt.profissao}, 
                portador da cédula de identidade RG. nº ${dtlt.rg} e CPF nº ${dtlt.cpf}, 
                residente e domiciliando à ${dtlt.logradouro}, ${dtlt.complemento},${dtlt.numero}, ${dtlt.bairro}, 
                CEP ${dtlt.cep}, ${dtlt.cidade} - ${dtlt.uf}.
            
                <span class="subtitle">CLÁUSULA PRIMEIRA - DO OBJETO DA LOCAÇÃO</span>

                <span class="subtitle">1.1</span> O objeto deste contrato de locação é o imóvel, situado à ${dtim.logradouro}, ${dtim.complemento}, nº ${dtim.numero}, 
                ${dtim.bairro}, CEP ${dtim.cep}, ${dtim.cidade}-${dtim.uf}. No exato do termo de vistoria e fotos em anexo.

                <span class="subtitle">CLÁUSULA SEGUNDA - DA DESTINAÇÃO DO IMÓVEL</span>

                <span class="subtitle">2.1</span> O LOCATÁRIO declara que o imóvel, ora locado, destina-se única e exclusiva para o seu 
                uso RESIDENCIAL.

                <span class="subtitle">2.2</span> O LOCATÁRIO obriga por si e demais dependentes a cumprir e a fazer cumprir integralmente
                as disposições legais sobre o Condomínio, a sua Convenção e o seu Regulamento Interno.

                <span class="subtitle">CLÁUSULA TERCEIRA - DO PRAZO DE VIGÊNCIA</span>

                <span class="subtitle">3.1</span> O prazo da locação é de 6 meses, iniciando-se em ${dtInicial} com término em ${dtFinal},
                independentemente de aviso, notificação ou interpelação judicial ou extrajudicial.

                <span class="subtitle">3.2</span> Findo o prazo ajustado, se o locatário continuar na posse do imóvel alugado por mais de trinta
                dias sem oposição do locador, presumir-se-á prorrogada a locação por prazo indeterminado,
                mantidas as demais cláusulas e condições do contrato.

                <span class="subtitle">CLÁUSULA QUARTA - DA FORMA DE PAGAMENTO</span>

                <span class="subtitle">4.1</span> O aluguel mensal deverá ser pago até o dia 10 (DEZ) do mês subsequente ao vencido, por
                meio de dinheiro, ou transferência bancária, no valor de ${aluguel} (${valorExtenso}), 
                sendo ${valorDescontado} somente do aluguel e ${agua} o valor da água.

                <span class="subtitle">CLÁUSULA QUINTA - DA CONSERVAÇÃO, REFORMAS E BENFEITORIAS</span>

                <span class="subtitle">5.1</span> Ao LOCATÁRIO recai a responsabilidade por zelar pela conservação, limpeza do imóvel e
                segurança.
            </p>
        </div>
        <div class="page-break" style="height: 0; margin: 0;"></div>
        <div class="box">
            <p style="white-space:pre;">
                <span class="subtitle">5.2</span> As benfeitorias necessárias introduzidas pelo LOCATÁRIO, ainda que não autorizadas pelo
                LOCADOR, bem como as úteis, desde que autorizadas, serão indenizáveis e permitem o exercício
                do direito de retenção. As benfeitorias voluntárias não serão indenizáveis, podendo ser levantadas
                pelo LOCATÁRIO, finda a locação, desde que sua retirada não afete a estrutura e a substância do
                imóvel.

                <span class="subtitle">5.3</span> O LOCATÁRIO está obrigado a devolver o imóvel em perfeitas condições de limpeza,
                conservação e pintura, quando finda ou rescindida esta avença.
                
                <span class="subtitle">5.4</span> O LOCATÁRIO não poderá realizar obras que alterem ou modifiquem a estrutura do imóvel
                locado, sem prévia autorização por escrito da LOCADORA. No caso de prévia autorização, as
                obras serão incorporadas ao imóvel, sem que caiba ao LOCATÁRIO qualquer indenização pelas
                obras ou retenção por benfeitorias.

                <span class="subtitle">5.5</span> Cabe ao LOCATÁRIO verificar a voltagem e a capacidade de instalação elétrica existente no
                imóvel, sendo de sua exclusiva responsabilidade pelos danos e prejuízos que venham a ser
                causados em seus equipamentos elétrico-eletrônico por inadequação à voltagem e/ou capacidade
                instalada. Qualquer alteração da voltagem deverá de imediato ser comunicada ao LOCADOR(A),
                por escrito. Ao final da locação, antes de fazer a entrega das chaves, o LOCATÁRIO(A)
                deverá proceder à mudança para a voltagem original.

                <span class="subtitle">5.6</span> O LOCADOR deve responder pelos vícios ou defeitos anteriores à locação.

                <span class="subtitle">5.7</span> O LOCATÁRIO fica responsável por descer seu lixo na segunda, quarta e sexta, até o horário
                de 12:00am, pois não é permitido descer a partir desse horário.

                <span class="subtitle">5.8</span> O LOCATÁRIO fica responsável por realizar a limpeza dos corredores e escadas uma vez por
                semana.

                <span class="subtitle">5.9</span> O LOCATÁRIO que optar por não realizar a limpeza dos corredores e escadas poderá ser
                dispensado realizando o pagamento de uma taxa mensal no valor de ${limpeza}.

                <span class="subtitle">PARÁGRAFO ÚNICO</span>: O LOCATÁRIO declara receber o imóvel em perfeito estado de
                conservação e perfeito funcionamento, devendo observar o que consta no termo de vistoria, não
                respondendo por vícios ocultos ou anteriores à locação.

                <span class="subtitle">CLÁUSULA SEXTA - DAS TAXAS E TRIBUTOS</span>

                <span class="subtitle">6.1</span> O LOCATÁRIO deve repassar o valor da luz para o LOCADOR até o dia 08 de cada mês,
                para que o mesmo realize o pagamento da conta.
            </p>
        </div>
        <div class="page-break" style="height: 0; margin: 0;"></div>
        <div class="box">
            <p style="white-space:pre;">
                <span class="subtitle">CLÁUSULA SÉTIMA - DA SUBLOCAÇÃO</span>

                <span class="subtitle">7.1</span> É vedado ao LOCATÁRIO sublocar, transferir ou ceder o imóvel, sendo nulo de pleno direito
                qualquer ato praticado com este fim sem o consentimento prévio e por escrito do
                LOCADOR.

                <span class="subtitle">CLÁUSULA OITAVA - DA DESAPROPRIAÇÃO</span>

                <span class="subtitle">8.1</span> Em caso de desapropriação total ou parcial do imóvel locado, ficará rescindido de pleno
                direito o presente contrato de locação, sendo passível de indenização as perdas e danos
                efetivamente demonstrados.

                <span class="subtitle">8.2</span> O LOCATÁRIO deve comunicar com antecedência de 30 dias ao LOCADOR em
                caso de rescisão de contrato.

                <span class="subtitle">CLÁUSULA NONA - DAS INFRAÇÕES AO CONTRATO</span>

                <span class="subtitle">9.1</span> A não observância de qualquer das cláusulas do presente contrato sujeita o infrator à multa
                de 1 vez o valor do aluguel, tomando-se por base o último aluguel vencido.

                <span class="subtitle">9.2</span> Em caso de atraso do pagamento de aluguel, haverá multa de R$ 10,00 ao dia após 
                o vencimento.

                <span class="subtitle">CLÁUSULA DÉCIMA - DA RESCISÃO DO CONTRATO</span>

                <span class="subtitle">10.1</span> A rescisão previamente à vigência do presente contrato culmina em multa contratual de
                ${aluguel} ao mês, dispensando os meses restantes.

                <span class="subtitle">10.2</span> Após o prazo de vigência do presente contrato, podem as partes rescindirem o 
                contrato mediante aviso prévio de 30 dias.

                <span class="subtitle">CLÁUSULA DÉCIMA PRIMEIRA - DO FORO</span>

                <span class="subtitle">11.1</span> As partes elegem o foro de Irecê/Bahia para dirimirem qualquer litígio decorrente do
                presente termo.

                E, por assim estarem justos e contratados, mandaram extrair o presente instrumento em duas
                (02) vias, para um só efeito, assinando-as, juntamente com as testemunhas, a tudo presente.
                                                                                                                                                   
            </p>
            <pre style="font-weight:bolder;">
                                            ${dtct.cidade}/${dtct.uf}, ${dtct.dia} de ${dtct.mes} de ${dtct.ano}
            </pre>
            <br>
            <div class="assinatura">
                <div class="div-ass">
                    <div class="ass"></div>
                    <p class="line-assinature">${dtlc.nome}</p>
                </div>
                <div class="div-ass">
                    <div class="ass"></div>
                    <p class="line-assinature">${dtlt.nome}</p>
                </div>
            </div>
            
            <div class="assinatura">
                <div class="div-ass">
                    <div class="ass"></div>
                    <p class="line-assinature">TESTEMUNHA 1</p>
                </div>
                <div class="div-ass">
                    <div class="ass"></div>
                    <p class="line-assinature">TESTEMUNHA 2</p>
                </div>
            </div>

        </div>
    `;

    // Exibir preview
    document.getElementById('contratoContent').innerHTML = contrato;
    document.getElementById('contratoPreview').classList.remove('hidden');
}



function gerarPDF() {
  const { jsPDF } = window.jspdf;
  const container = document.getElementById("contratoContent");
  const divs = container.querySelectorAll(".box"); // Seleciona todas as divs com a classe "box"

  const pdf = new jsPDF("p", "mm", "a4"); // Cria um novo PDF
  const imgWidth = 210; // Largura A4 em mm
  const imgHeight = 297; // Altura A4 em mm

  let currentPage = 0;

  // Função para processar cada div
  function processDiv(index) {
    if (index >= divs.length) {
      // Finaliza o PDF quando todas as divs forem processadas
      pdf.save("contrato.pdf");
      return;
    }

    const div = divs[index];
    html2canvas(div, {
      scale: 2, // Aumenta a qualidade
      useCORS: true,
      windowHeight: div.scrollHeight // Captura o conteúdo total da div
    }).then(canvas => {
      const imgData = canvas.toDataURL("image/png");
      const aspectRatio = canvas.width / canvas.height;
      const imgHeightInPDF = imgWidth / aspectRatio;

      // Adiciona uma nova página (exceto na primeira iteração)
      if (currentPage > 0) {
        pdf.addPage();
      }

      // Adiciona a imagem da div ao PDF
      pdf.addImage(
        imgData,
        "PNG",
        0, // X
        0, // Y
        imgWidth,
        imgHeightInPDF
      );

      currentPage++;
      processDiv(index + 1); // Processa a próxima div
    });
  }

  processDiv(0); // Inicia o processamento da primeira div
}
