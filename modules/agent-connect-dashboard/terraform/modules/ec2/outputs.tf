output "instance_id" {
  value = aws_instance.backend.id
}

output "public_ip" {
  value = aws_eip.backend.public_ip
}

output "security_group_id" {
  value = aws_security_group.ec2.id
}

output "wazuh_instance_id" {
  value = aws_instance.wazuh.id
}

output "wazuh_public_ip" {
  value = aws_eip.wazuh.public_ip
}

output "wazuh_security_group_id" {
  value = aws_security_group.wazuh.id
}
