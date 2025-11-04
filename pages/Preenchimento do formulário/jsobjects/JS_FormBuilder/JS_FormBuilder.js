export default {
  // 1) Source data: the object the JSON Form edits
  // Keys are the visible question texts (with punctuation); values = current answers.
  sourceData: () => {
    const rows = JS_Pager.slice() || [];
    const data = {};

    rows.forEach((r) => {
      const questionText = `${r.numero_ind ? r.numero_ind + " — " : ""}${r.pergunta}`;
      // default empty (no answer yet) or restore from store if you paginate
      data[questionText] = (appsmith.store.answers && appsmith.store.answers[questionText]) || "";
    });

    return data;
  },

  // 2) Field configuration: tells JSON Form which widget to use for each field
  fieldConfig: () => {
    const rows = JS_Pager.slice() || [];
    const config = {};

    rows.forEach((r) => {
      const questionText = `${r.numero_ind ? r.numero_ind + " — " : ""}${r.pergunta}`;

      config[questionText] = {
        // Label shown by JSON Form — use the question text (with punctuation)
        label: questionText,

        // Make it a single-choice Radio Group
        fieldType: "RadioGroup",

        // The three options (single select)
        options: [
          { label: "NA", value: "NA" },
          { label: "Sim", value: "Sim" },
          { label: "Não", value: "Não" }
        ],

        // Optional UI tweaks:
        isRequired: false,      // set true if you want to force an answer
        showCard: false,        // hide the gray "P2" card chrome
        // labelPosition: "Top", // leave default or set as you prefer
      };
    });

    return config;
  }
};
