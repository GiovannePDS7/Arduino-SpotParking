CREATE DATABASE SpotParking;

USE SpotParking;

-- CRIANDO TABELAS:

CREATE TABLE Usuario (
	idUsuario INT PRIMARY KEY AUTO_INCREMENT,
	nome VARCHAR(45) NOT NULL,
	email VARCHAR(30) NOT NULL,
	senha VARCHAR(255) NOT NULL,
	funcao VARCHAR(30) 
);

CREATE TABLE Shopping (
	idShopping INT PRIMARY KEY AUTO_INCREMENT,
	nomeFantasia VARCHAR(45) NOT NULL,
	cnpj CHAR(14) NOT NULL,
    cep CHAR(8) NOT NULL,
	rua VARCHAR(45) NOT NULL,
	bairro VARCHAR(45) NOT NULL,
	numero VARCHAR(10) NOT NULL,
	cidade VARCHAR(45) NOT NULL,
	UF CHAR(2) NOT NULL,
	fkUsuario INT NOT NULL,
	CONSTRAINT fkUsuario FOREIGN KEY (fkUsuario) REFERENCES Usuario(idUsuario)
);

CREATE TABLE Estacionamento (
	idEstacionamento INT PRIMARY KEY AUTO_INCREMENT,
	capacidade INT NOT NULL,
	fkShopping INT NOT NULL,
	CONSTRAINT fkShopping FOREIGN KEY (fkShopping) REFERENCES Shopping(idShopping)
);


-- TABELAS DE FUNCIONAMENTO DO SISTEMA/DASHBOARD:

CREATE TABLE Vaga (
	idVaga INT PRIMARY KEY AUTO_INCREMENT,
	piso CHAR(10) NOT NULL,
	posicao CHAR(10) NOT NULL,
	fkEstacionamento INT NOT NULL,
	CONSTRAINT fkEstacionamentoVaga FOREIGN KEY (fkEstacionamento) REFERENCES Estacionamento(idEstacionamento)
);

CREATE TABLE Sensor (
	idSensor INT PRIMARY KEY AUTO_INCREMENT,
	tipo VARCHAR(45) NOT NULL,
	fkVaga INT NOT NULL,
	CONSTRAINT fkVaga FOREIGN KEY (fkVaga) REFERENCES Vaga(idVaga)
);

CREATE TABLE Demanda_Ocupacional (
	idDemandOcup INT NOT NULL AUTO_INCREMENT,
	fkSensor INT NOT NULL,
    CONSTRAINT fkSensor FOREIGN KEY (fkSensor) REFERENCES Sensor(idSensor),
	CONSTRAINT PkComposta PRIMARY KEY (idDemandOcup, fkSensor),
	status_vaga VARCHAR(20) NOT NULL
);

CREATE TABLE Log(
	idLog INT PRIMARY KEY AUTO_INCREMENT,
    fkDemandOcup INT NOT NULL,
    CONSTRAINT fkDemandOcup FOREIGN KEY (fkDemandOcup) REFERENCES Demanda_Ocupacional(idDemandOcup),
    fkSensor INT NOT NULL,
	CONSTRAINT fkDemanOcupSensor FOREIGN KEY (fkSensor) REFERENCES Demanda_Ocupacional(fkSensor),
    status_vaga VARCHAR(20) NOT NULL,
    dataHora DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);

INSERT INTO Usuario (
    nome, email, senha, funcao
) VALUES (
    'João Silva', 'joao.silva@email.com', 'senhaSegura123', 'Administrador'
);

INSERT INTO Shopping (
    nomeFantasia, cnpj, cep, rua, bairro, numero, cidade, UF, fkUsuario
) VALUES (
    'Shopping Central', '12345678000199', '01001000', 'Av. Central', 'Centro', '1000', 'São Paulo', 'SP', 1
);

INSERT INTO Estacionamento (
    capacidade, fkShopping
) VALUES (
    200, 1
);

INSERT INTO Vaga (
    piso, posicao, fkEstacionamento
) VALUES (
    'P1', 'A01', 1
);

INSERT INTO Sensor (
    tipo, fkVaga
) VALUES (
    'Ultrassônico', 1
);
select * from Demanda_Ocupacional;

select * from Log;
