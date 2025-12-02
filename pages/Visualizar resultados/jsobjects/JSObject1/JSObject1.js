export default {
    Ano() {
        const anoAtual = new Date().getFullYear();

        // Create an array with the last 10 years
        const ultimosAnos = Array.from({ length: 10 }, (_, i) => anoAtual - i);

        return ultimosAnos;
    }
};
