resource "aws_security_group" "wazuh" {
  name        = "${var.project_name}-wazuh-sg"
  description = "Security group for Wazuh Manager"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP server for alerts.json"
  }

  ingress {
    from_port   = 8001
    to_port     = 8001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Custom service port 8001"
  }

  ingress {
    from_port   = 5601
    to_port     = 5601
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Wazuh dashboard access"
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access"
  }

  ingress {
    from_port   = -1
    to_port     = -1
    protocol    = "icmp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "ICMP (ping)"
  }

  ingress {
    from_port   = 1514
    to_port     = 1514
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Wazuh agent communication"
  }

  ingress {
    from_port   = 1515
    to_port     = 1515
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Wazuh agent enrollment"
  }

  ingress {
    from_port   = 151
    to_port     = 151
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Custom service port 151"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-wazuh-sg"
    Project = var.project_name
  }
}

resource "aws_instance" "wazuh" {
  ami                    = "ami-0b571a36bf02461b4"
  instance_type          = "c7i-flex.large"
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [aws_security_group.wazuh.id]
  iam_instance_profile   = var.iam_instance_profile

  user_data = file("${path.module}/wazuh_user_data.sh")

  root_block_device {
    volume_size = 50
    volume_type = "gp3"
  }

  tags = {
    Name    = "${var.project_name}-wazuh-manager"
    Project = var.project_name
  }
}

resource "aws_eip" "wazuh" {
  domain = "vpc"

  tags = {
    Name    = "${var.project_name}-wazuh-eip"
    Project = var.project_name
  }
}

resource "aws_eip_association" "wazuh" {
  instance_id   = aws_instance.wazuh.id
  allocation_id = aws_eip.wazuh.id
}
