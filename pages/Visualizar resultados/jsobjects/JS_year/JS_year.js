export default {
    Year() {
        const currentYear = new Date().getFullYear();

        // Create an array with the last 10 years
        const lastYears = Array.from({ length: 10 }, (_, i) => currentYear - i);

        return lastYears;
    }
};

