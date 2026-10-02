package com.guide.esm.service.impl;

import com.guide.esm.dto.EmployeeDto;
import com.guide.esm.entity.Employee;
import com.guide.esm.mapper.EmployeeMapper;
import com.guide.esm.repository.EmployeeRepository;
import com.guide.esm.service.EmployeeService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;

    @Override
    public EmployeeDto createEmployee(EmployeeDto employeeDto) {
        Employee employee = EmployeeMapper.mapToEmployee(employeeDto);

        Employee savedEmployee = this.employeeRepository.save(employee);

        return EmployeeMapper.mapToEmployeeDto(savedEmployee);
    }
}
