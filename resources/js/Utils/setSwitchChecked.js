const setSwitchChecked = (input, checked) => {
  if (!input) return
  input.checked = !!checked
  if (input.switchery?.setPosition) input.switchery.setPosition()
}

export default setSwitchChecked
