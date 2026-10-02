package com.guide.esm.service.impl;

import com.guide.esm.dto.EmployeeDto;
import com.guide.esm.entity.Employee;
import com.guide.esm.exception.ResourceNotFoundException;
import com.guide.esm.mapper.EmployeeMapper;
import com.guide.esm.repository.EmployeeRepository;
import com.guide.esm.service.EmployeeService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@AllArgsConstructor
@Transactional(readOnly = true)
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;

    @Override
    @Transactional
    public EmployeeDto create(EmployeeDto dto) {
        Employee employee = EmployeeMapper.mapToEmployee(dto);

        Employee savedEmployee = this.employeeRepository.save(employee);

        return EmployeeMapper.mapToEmployeeDto(savedEmployee);
    }

    @Override
    public EmployeeDto getById(Long id) {
        Employee employee = this.employeeRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Employee with the given ID does not exist: " + id)
                );

        return EmployeeMapper.mapToEmployeeDto(employee);
    }

    @Override
    public List<EmployeeDto> getAllEmployees() {
        List<Employee> employees = this.employeeRepository.findAll();

        return employees.stream().map((EmployeeMapper::mapToEmployeeDto)).toList();
    }

    @Override
    @Transactional
    public EmployeeDto updateEmployee(Long employeeId, EmployeeDto updatedEmployee) {
        Employee employee = this.employeeRepository.findById(employeeId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Employee with the given ID does not exist: " + employeeId)
                );

        employee.setFirstName(updatedEmployee.getFirstName());
        employee.setLastName(updatedEmployee.getLastName());
        employee.setEmail(updatedEmployee.getEmail());

        Employee savedEmployee = this.employeeRepository.save(employee);

        return EmployeeMapper.mapToEmployeeDto(savedEmployee);
    }

    @Override
    @Transactional
    public EmployeeDto deleteEmployee(Long employeeId) {
        Employee employee = this.employeeRepository.findById(employeeId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Employee with the given ID does not exist: " + employeeId)
                );

        EmployeeDto employeeDto = EmployeeMapper.mapToEmployeeDto(employee);
        this.employeeRepository.delete(employee);

        return employeeDto;
    }
}
