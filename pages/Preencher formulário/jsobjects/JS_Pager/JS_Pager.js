export default {
  pageSize: 20, // ajuste p/ caber bem no limite
  total: () => (Qry_getQuestions.data || []).length,
  pages: () => Math.max(1, Math.ceil(JS_Pager.total() / JS_Pager.pageSize)),
  current: () => appsmith.store.page || 1,
  setPage: async (p) => {
    // Antes de trocar de página, guarda as respostas da página atual
    await storeValue("answers", {
      ...(appsmith.store.answers || {}),
      ...(JSONForm1.formData || {}) // merge das respostas atuais
    });
    // Muda de página (com limites)
    const newPage = Math.min(Math.max(1, p), JS_Pager.pages());
    await storeValue("page", newPage);
    // Limpa os dados do JSONForm para a nova página ser reconstruída
    resetWidget("JSONForm1", true); // força rebuild do schema/bindings
  },
  slice: () => {
    const rows = Qry_getQuestions.data || [];
    const start = (JS_Pager.current() - 1) * JS_Pager.pageSize;
    return rows.slice(start, start + JS_Pager.pageSize);
  }
}
