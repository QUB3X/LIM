module.exports = function(grunt) {

  grunt.initConfig({
  	'electron': {
      win32: {
        options: {
          name: "LIM",
          dir: '.',
          ignore: "(build|Installer)",
          icon: 'icon',
          overwrite: true,
          out: 'build/',
          platform: 'win32',
          arch: 'x64',
          version: "1.6.7",
          'version-string': {
            CompanyName: 'Andrea Franchini, Alessandro Astone',
            ProductName: 'LIM'
			// LegalCopyright
			// FileDescription
			// OriginalFilename
			// FileVersion
			// ProductVersion
			// InternalName
		  }
		}
	  }
	},

	'create-windows-installer': {
	  x64: {
		appDirectory: 'build/LIM-win32-x64',
		outputDirectory: './Installer/x64',
		authors: 'Andrea Franchini, Alessandro Astone',
		exe: 'LIM.exe',
		title: 'LIM',
		iconUrl: 'https://raw.githubusercontent.com/QUB3X/LIM/master/icon.ico',
		setupIcon: 'icon.ico',
		noMsi: true
	  }/*,
	  ia32: {
		appDirectory: '/Users/aless/Documents/LIM/LIM-win32-ia32',
		outputDirectory: '/Users/aless/Documents/LIM/Installer/x32',
		authors: 'Andrea Franchini, Alessandro Astone',
		exe: 'LIM.exe',
		title: 'LIM',
		noMsi: true
	  }*/
	}
  });

  grunt.loadNpmTasks('grunt-electron');
  grunt.loadNpmTasks('grunt-electron-installer');

  grunt.registerTask('default', ['jshint']);

};