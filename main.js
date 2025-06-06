// importa os bibliotecas necessários
const serialport = require('serialport');
const express = require('express');
const mysql = require('mysql2');

// constantes para configurações
const SERIAL_BAUD_RATE = 9600;
const SERVIDOR_PORTA = 3300;

// habilita ou desabilita a inserção de dados no banco de dados
const HABILITAR_OPERACAO_INSERIR = true;

// função para comunicação serial
const serial = async (
    valoresSensorDigital,
) => {

    // conexão com o banco de dados MySQL
    let poolBancoDados = mysql.createPool(
        {
            host: 'localhost',
            user: 'aluno',
            password: 'sptech',
            database: 'SpotParking',
            port: 3306
        }
    ).promise();

    // lista as portas seriais disponíveis e procura pelo Arduino
    const portas = await serialport.SerialPort.list();
    const portaArduino = portas.find((porta) => porta.vendorId == 2341 && porta.productId == 43);
    if (!portaArduino) {
        throw new Error('O arduino não foi encontrado em nenhuma porta serial');
    }

    // configura a porta serial com o baud rate especificado
    const arduino = new serialport.SerialPort(
        {
            path: portaArduino.path,
            baudRate: SERIAL_BAUD_RATE
        }
    );

    // evento quando a porta serial é aberta
    arduino.on('open', () => {
        console.log(`A leitura do arduino foi iniciada na porta ${portaArduino.path} utilizando Baud Rate de ${SERIAL_BAUD_RATE}`);
    });

    // processa os dados recebidos do Arduino
    arduino.pipe(new serialport.ReadlineParser({ delimiter: '\r\n' })).on('data', async (data) => {
        console.log(data);

        // Dados como ex: "1:1" -> "idSensor:statusVaga"
        const [idSensorStr, statusStr] = data.split(':');
        const idSensor = parseInt(idSensorStr);
        const valor = parseInt(statusStr);

        const sensorDigital = parseInt(valor);

        // armazena os valores dos sensores nos arrays correspondentes
        valoresSensorDigital.push(sensorDigital);

        // insere os dados no banco de dados (se habilitado)
        if (HABILITAR_OPERACAO_INSERIR) {

            //Pega o ultimo registro do sensor e armazena num array em formato Json
            const [ultimosRegistros] = await poolBancoDados.execute(`
            SELECT * FROM Demanda_Ocupacional  
            WHERE fkSensor = ? 
            ORDER BY idDemandOcup DESC 
            LIMIT 1
            `, [idSensor]);

            let novoStatus = valor === 1 ? 'Ocupado' : 'Disponivel';

            if (ultimosRegistros.length === 0) { // cria um novo registro no sensor se não existir que será tratado eventualmente
                await poolBancoDados.execute(`
                        INSERT INTO Demanda_Ocupacional (fkSensor, status_vaga) 
                        VALUES (?, ?)`
                    , [idSensor, novoStatus]
                );
            } else {
                const ultimo = ultimosRegistros[0];

                if (ultimo.status_vaga !== novoStatus) {
                    if (novoStatus === 'Disponivel') {
                        // Atualiza saida da vaga ocupada
                        await poolBancoDados.execute(`
                        UPDATE Demanda_Ocupacional 
                        SET status_vaga = ? 
                        WHERE idDemandOcup = ? AND fkSensor = ?
                        `, ["Ocupação finalizada", ultimo.idDemandOcup, idSensor]
                        );
                        await poolBancoDados.execute(`
                            INSERT INTO Demanda_Ocupacional (fkSensor, status_vaga) 
                            VALUES (?, ?)
                            `, [idSensor, novoStatus]
                        );
                    } else {
                        await poolBancoDados.execute(`
                        UPDATE Demanda_Ocupacional SET status_vaga = ? 
                        WHERE idDemandOcup = ? AND fkSensor = ?
                          `, [novoStatus, ultimo.idDemandOcup, idSensor]
                        );
                    }
                    console.log(`[MUDANÇA] Sensor ${idSensor} status alterado para: ${novoStatus}`);
                } else {
                    console.log(`[SEM MUDANÇA] Sensor ${idSensor} continua como: ${novoStatus}`);
                }
            }
            const [ultimosRegistrosDemandOcup] = await poolBancoDados.execute(`
            SELECT * FROM Demanda_Ocupacional  
            WHERE fkSensor = ? 
            ORDER BY idDemandOcup DESC 
            LIMIT 1
                `, [idSensor]);

            await poolBancoDados.execute(`
                        INSERT INTO Log (fkDemandOcup, fkSensor, status_vaga) 
                        VALUES (?, ?, ?)`
                , [ultimosRegistrosDemandOcup[0].idDemandOcup, idSensor, novoStatus]
            );
        }
    });

    // evento para lidar com erros na comunicação serial
    arduino.on('error', (mensagem) => {
        console.error(`Erro no arduino (Mensagem: ${mensagem}`)
    });
}

// função para criar e configurar o servidor web
const servidor = (
    valoresSensorDigital
) => {
    const app = express();

    // configurações de requisição e resposta
    app.use((request, response, next) => {
        response.header('Access-Control-Allow-Origin', '*');
        response.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept');
        next();
    });

    // inicia o servidor na porta especificada
    app.listen(SERVIDOR_PORTA, () => {
        console.log(`API executada com sucesso na porta ${SERVIDOR_PORTA}`);
    });

    app.get('/sensores/digital', (_, response) => {
        return response.json(valoresSensorDigital);
    });
}

// função principal assíncrona para iniciar a comunicação serial e o servidor web
(async () => {
    // arrays para armazenar os valores dos sensores
    const valoresSensorDigital = [];

    // inicia a comunicação serial
    await serial(
        valoresSensorDigital
    );

    // inicia o servidor web
    servidor(
        valoresSensorDigital
    );
})();