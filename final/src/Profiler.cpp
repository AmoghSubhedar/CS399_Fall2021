#include "Profiler.h"
#include <DbgHelp.h>
#include <fstream>
#include <tlhelp32.h> 
#include <iostream>
#include <Shlwapi.h>

#pragma comment(lib, "Shlwapi.lib")
#pragma comment(lib, "dbghelp.lib")

static double timer;

VOID CALLBACK sample(PVOID param, BOOLEAN timedout)
{
  (void)timedout;
  Profiler* p = reinterpret_cast<Profiler*>(param);
  SuspendThread(p->mainthread); //suspend thread so we can grab context
  CONTEXT context{ 0 };
  context.ContextFlags = WOW64_CONTEXT_i386 | CONTEXT_CONTROL;
  GetThreadContext(p->mainthread, &context);
  ResumeThread(p->mainthread);

  long time = std::lroundl(10.0 * timer);
  if (time >= p->data.size())
    p->data.push_back({});

  ++(p->data[time][context.Rip]);

  p->allFunctions.insert(context.Rip);

  if (++p->samplecount > p->maxsamples) //stop sampling after maxsamples is reached
    SetEvent(p->done);

  timer += 0.01f;
}


Profiler::Profiler()
{
  SymSetOptions(SYMOPT_UNDNAME | SYMOPT_DEFERRED_LOADS); //initialize sym
  SymInitialize(GetCurrentProcess(), NULL, true);

  WCHAR wbuffer[MAX_PATH];
  CHAR cbuffer[MAX_PATH * 2];
  GetModuleFileName(NULL, wbuffer, MAX_PATH);
  WCHAR* res = nullptr;
  res = PathFindFileName(wbuffer);
  wcstombs(cbuffer, res, MAX_PATH);
  baseName = cbuffer;


  mainthread = OpenThread(THREAD_SUSPEND_RESUME | THREAD_GET_CONTEXT | THREAD_QUERY_INFORMATION, 0, GetCurrentThreadId());
  done = CreateEvent(NULL, TRUE, FALSE, NULL);
  timerqueue = CreateTimerQueue();
  CreateTimerQueueTimer(&timer, timerqueue, (WAITORTIMERCALLBACK)sample, this, 1, 1, 0);  //automatically calls sample every 1 ms
}

std::string GetModuleNameFromAddr(ULONG64 modAddr)
{
  HANDLE moduleList = INVALID_HANDLE_VALUE;
  MODULEENTRY32 module{};
  module.dwSize = sizeof(MODULEENTRY32);
  moduleList = CreateToolhelp32Snapshot(TH32CS_SNAPMODULE, GetProcessId(GetCurrentProcess()));

  do
  {
    if ((ULONG64)module.modBaseAddr == modAddr)
    {
      CloseHandle(moduleList);
	  CHAR cbuffer[MAX_PATH];
	  wcstombs(cbuffer, module.szModule, MAX_PATH);
      return std::string(cbuffer);
      break;
    }
  } while (Module32Next(moduleList, &module));

  CloseHandle(moduleList);
  return "";
}

Profiler::~Profiler()
{
  (void)DeleteTimerQueueEx(timerqueue, done);
  CloseHandle(done);
  
  ULONG64 buffer[(sizeof(SYMBOL_INFO) + MAX_SYM_NAME * sizeof(TCHAR) + sizeof(ULONG64) - 1) / sizeof(ULONG64)]; //make read buffer for function names
  
  std::unordered_map<DWORD64, std::string>modules;
  std::set<std::string> moduleNames;

  for (auto& it : allFunctions)
  {
    PDWORD64 displace = 0;
    PSYMBOL_INFO sym = (PSYMBOL_INFO)buffer;
    sym->SizeOfStruct = sizeof(SYMBOL_INFO);
    sym->MaxNameLen = MAX_SYM_NAME;
    SymFromAddr(GetCurrentProcess(), it, displace, sym); //get function name
    std::string modname = GetModuleNameFromAddr(sym->ModBase);
    if (modname == "")
      modname = baseName;
    modules[it] = modname;
    moduleNames.insert(modname);
  }

  std::ofstream log("ProfileReport.csv"); //record all data to csv
  log << "Timestamp";
  for (auto& it : moduleNames)
    log << "," << it ;  
  log << "\n";

  std::unordered_map<std::string, int> hitTotals;
  for (auto& it : moduleNames)
  {
    hitTotals[it] = 0;
  }
 
  for (size_t i = 0; i < data.size(); ++i)
  {
    log << i / 10.0;
    for (auto it : data[i])
    {
      hitTotals[modules[it.first]] += it.second;
    }
    for (auto& it : moduleNames)
    {
      log << "," << hitTotals[it];
    }
    log << "\n";
  }
  log << std::endl;

}