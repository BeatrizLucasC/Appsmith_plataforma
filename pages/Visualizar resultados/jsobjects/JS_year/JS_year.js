export default {
    myVar1: [],
    myVar2: {},
    myFun1() {
        // Obter o ano atual
        const anoAtual = new Date().getFullYear();
        
        // Criar um array com os últimos 10 anos
        const ultimosAnos = [];
        for (let i = 0; i < 10; i++) {
            ultimosAnos.push(anoAtual - i);
        }

        // Guardar no myVar1
        this.myVar1 = ultimosAnos;
        return ultimosAnos; // devolve o array para usar diretamente
    },
    async myFun2() {
        // Exemplo: apenas chamar a função e usar o resultado
        return this.myFun1();
    }
}
