terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_vpc" "skilldna_vpc" {
  cidr_block = "10.0.0.0/16"
  tags = {
    Name = "skilldna-vpc"
  }
}
