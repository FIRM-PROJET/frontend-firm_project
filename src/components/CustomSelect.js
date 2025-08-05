import Select from 'react-select';

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: '#282850',
    borderColor: state.isFocused ? '#514f84' : '#514f84',
    color: 'white',
    minHeight: '10px',
    fontSize: '12px',
    boxShadow: '#514f84', 
    '&:hover': {
      borderColor: '#514f84'
    }
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: '#282850',
    color: 'white',
    zIndex: 9999
  }),
  option: (base, state) => ({
  ...base,
  backgroundColor: state.isSelected
    ? '#2d2d3eff'
    : state.isFocused
    ? '#5a479d'
    : '#2d2d3eff',
  color: state.isSelected || state.isFocused ? '#fff' : '#ccc',
  cursor: 'pointer',
  padding: '5px 10px',
  fontSize: '12px',
  '&:hover': {
    backgroundColor: '#5a479d',
    color: '#fff'
  }
}),

  singleValue: (base) => ({
    ...base,
    color: 'white'
  }),
  input: (base) => ({
    ...base,
    color: 'white'
  }),
  indicatorSeparator: () => ({
    display: 'none'
  }),
  indicatorsContainer: (base) => ({
    ...base,
    color: 'white'
  }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: 'white',
    '&:hover': {
      color: '#c4b5fd'
    }
  })
};

const CustomSelect = ({
  value,
  onChange,
  options,
  placeholder,
  isDisabled
}) => {
  const formattedOptions = options.map(opt => ({
    value: opt.nom || opt.label || opt,
    label: opt.nom || opt.label || opt
  }));

  const selectedOption = value
    ? { value, label: value }
    : null;

  return (
    <Select
      styles={customSelectStyles}
      value={selectedOption}
      onChange={(selected) => onChange(selected ? selected.value : '')}
      options={formattedOptions}
      placeholder={placeholder}
      isDisabled={isDisabled}
    />
  );
};

export default CustomSelect;