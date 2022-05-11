export default (...arrs) => {
    const _ = arrs.reduce((prev, curr) => {
      if (curr.length > prev.length) {
        return curr;
      }
      return prev;
    });
    return _.map((_, i) => arrs.map(arr => arr[Math.min(i, arr.length - 1)]));
  };
  