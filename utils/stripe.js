const stripeStatus = (stripeObj, business) => {
  let status = 'not-started';
  if (stripeObj) {
      if (stripeObj.requirements.errors.length > 0) {
          status = 'has-failed';
      } else if (stripeObj.requirements.currently_due.length == 0 &&
          stripeObj.requirements.past_due.length == 0 &&
          stripeObj.requirements.disabled_reason == null ) {
          status = 'success';
      } else if (stripeObj.requirements.disabled_reason.length > 0 && 
          stripeObj.requirements.disabled_reason != 'requirements.pending_verification') {
          status = 'waiting-for-input';
      } else if (stripeObj.requirements.pending_verification.length > 0) {
          status = 'pending-verification';
      } else {
          status = 'unknown';
      }
  }

  return status;
};


module.exports = {
  stripeStatus
}