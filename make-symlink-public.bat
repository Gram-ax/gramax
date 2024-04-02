@echo off
PowerShell -Command "If (Test-Path '.\apps\next\public') { Remove-Item '.\apps\next\public' -Force }"
PowerShell -Command "New-Item -ItemType SymbolicLink -Path '.\apps\next\public' -Target '.\core\public\'"
