export default {
  index: 0,
  setIndex: function(newVal) {
    this.index = newVal;
    return this.index;
  },
  increment: function() {
    this.index += 1;
    return this.index;
  }
}
