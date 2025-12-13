export default {
  // Check if the 'enquadramento' value is valid
  hasEnquadramento(item) {
    if (!item || !item.enquadramento) return false;
    const value = String(item.enquadramento).trim();
    return value.length > 0;
  },

  // Optionally, return the tooltip text
  getEnquadramentoTooltip(item) {
    if (!this.hasEnquadramento(item)) return "";
    return String(item.enquadramento).trim();
  }
};
