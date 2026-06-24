
~ ❯ sudo nmap -sS -sV iiec.ifheindia.org                                                                                          
Starting Nmap 7.99 ( https://nmap.org ) at 2026-06-19 12:08 +0530
Nmap scan report for iiec.ifheindia.org (3.109.15.154)
Host is up (0.0093s latency).
rDNS record for 3.109.15.154: ec2-3-109-15-154.ap-south-1.compute.amazonaws.com
Not shown: 995 filtered tcp ports (no-response)
PORT     STATE  SERVICE     VERSION
80/tcp   open   http        Microsoft IIS httpd 10.0
113/tcp  closed ident
443/tcp  open   ssl/https?
2000/tcp open   cisco-sccp?
5060/tcp open   sip?
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

